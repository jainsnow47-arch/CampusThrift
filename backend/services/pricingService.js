const CONDITION_ORDER = ['Like New', 'Excellent', 'Good', 'Fair', 'Poor'];

function getConditionIndex(condition) {
  const idx = CONDITION_ORDER.findIndex(
    (c) => c.toLowerCase() === String(condition || '').trim().toLowerCase()
  );
  return idx === -1 ? 2 : idx; // Default to 'Good' if unrecognized
}

function roundToNearestTen(value) {
  return Math.round(value / 10) * 10;
}

function suggestFairPrice(db, input) {
  const itemName = String(input.itemName || '').trim();
  const category = String(input.category || '').trim();
  const condition = String(input.condition || 'Good').trim();
  const ageInMonths = Math.max(0, Number(input.ageInMonths) || 0);
  const originalPrice = Number(input.originalPrice);

  if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
    const err = new Error('originalPrice must be a positive number');
    err.statusCode = 400;
    throw err;
  }

  let rows = db
    .prepare(
      `SELECT id, item_name, category, condition_grade AS condition, age_in_months AS ageInMonths,
              original_price AS originalPrice, sold_price AS soldPrice, resale_ratio AS resaleRatio
       FROM historical_transactions
       WHERE LOWER(category) = LOWER(?)`
    )
    .all(category);

  let usedFallback = false;
  if (rows.length === 0) {
    usedFallback = true;
    rows = db
      .prepare(
        `SELECT id, item_name, category, condition_grade AS condition, age_in_months AS ageInMonths,
                original_price AS originalPrice, sold_price AS soldPrice, resale_ratio AS resaleRatio
         FROM historical_transactions`
      )
      .all();
  }

  const targetCondIdx = getConditionIndex(condition);
  let weightedSum = 0;
  let totalWeight = 0;
  let baselineSum = 0;
  let comparableCount = 0;

  for (const row of rows) {
    const rowCondIdx = getConditionIndex(row.condition);
    const deltaCond = Math.abs(rowCondIdx - targetCondIdx);
    const deltaAge = Math.abs(Number(row.ageInMonths) - ageInMonths);

    const condWeight = Math.max(0.20, 1 - 0.25 * deltaCond);
    const ageWeight = Math.exp(-deltaAge / 16);
    const weight = condWeight * ageWeight;

    const ratio = Number(row.resaleRatio);
    weightedSum += weight * ratio;
    totalWeight += weight;
    baselineSum += ratio;

    if (deltaCond <= 1 && deltaAge <= 14) {
      comparableCount += 1;
    }
  }

  const weightedRatio = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  const categoryBaselineRatio = rows.length > 0 ? baselineSum / rows.length : 0.5;

  // Blend similarity-weighted ratio with category baseline based on comparable sample size
  const confidence = Math.min(0.85, comparableCount / 18);
  const blendedRatio = confidence * weightedRatio + (1 - confidence) * categoryBaselineRatio;

  const rawSuggested = originalPrice * blendedRatio;
  const boundedRaw = Math.min(originalPrice, Math.max(50, rawSuggested));
  const suggestedPrice = Math.min(
    originalPrice,
    Math.max(50, roundToNearestTen(boundedRaw))
  );

  const minimumPrice = Math.max(50, roundToNearestTen(suggestedPrice * 0.88));
  const maximumPrice = Math.min(
    originalPrice,
    Math.max(suggestedPrice, roundToNearestTen(suggestedPrice * 1.12))
  );

  const retentionPercentage = Number(((suggestedPrice / originalPrice) * 100).toFixed(1));
  const depreciationPercentage = Number((100 - retentionPercentage).toFixed(1));
  const categoryBaselineRetention = Number((categoryBaselineRatio * 100).toFixed(1));

  const effectiveComparables = comparableCount > 0 ? comparableCount : rows.length;
  const categoryLabel = usedFallback ? 'campus marketplace' : category.toLowerCase();

  const explanation =
    `Based on ${effectiveComparables} comparable historical ${categoryLabel} transactions ` +
    `with similar condition (${condition}) and age (~${ageInMonths} months), ` +
    `similar items (${itemName || category}) retain approximately ${retentionPercentage}% ` +
    `of their original value (${depreciationPercentage}% depreciation). Suggested resale price: ₹${suggestedPrice}.`;

  return {
    success: true,
    suggestedPrice,
    minimumPrice,
    maximumPrice,
    depreciationPercentage,
    retentionPercentage,
    comparableTransactions: effectiveComparables,
    categoryBaselineRetention,
    explanation
  };
}

function getPricingInsights(db) {
  const overall = db
    .prepare(
      `SELECT COUNT(*) AS totalCount,
              AVG(resale_ratio) * 100 AS avgResalePercent
       FROM historical_transactions`
    )
    .get();

  const totalHistoricalTransactions = Number(overall.totalCount || 0);
  const averageResalePercentage = Number(parseFloat(overall.avgResalePercent || 0).toFixed(1));
  const averageDepreciation = Number((100 - averageResalePercentage).toFixed(1));

  const categoryRows = db
    .prepare(
      `SELECT category,
              COUNT(*) AS transactionCount,
              AVG(resale_ratio) * 100 AS avgResalePercent
       FROM historical_transactions
       GROUP BY category
       ORDER BY avgResalePercent DESC`
    )
    .all();

  const categoryWiseInsights = categoryRows.map((row) => {
    const avgResale = Number(parseFloat(row.avgResalePercent || 0).toFixed(1));
    return {
      category: row.category,
      transactionCount: Number(row.transactionCount),
      avgResalePercent: avgResale,
      avgDepreciation: Number((100 - avgResale).toFixed(1))
    };
  });

  const conditionRows = db
    .prepare(
      `SELECT condition_grade AS condition,
              COUNT(*) AS transactionCount,
              AVG(resale_ratio) * 100 AS avgResalePercent
       FROM historical_transactions
       GROUP BY condition_grade`
    )
    .all();

  const conditionMap = new Map(conditionRows.map((r) => [r.condition, r]));
  const conditionWiseInsights = CONDITION_ORDER.filter((c) => conditionMap.has(c)).map((grade) => {
    const r = conditionMap.get(grade);
    return {
      condition: grade,
      transactionCount: Number(r.transactionCount),
      avgResalePercent: Number(parseFloat(r.avgResalePercent || 0).toFixed(1))
    };
  });

  const ageBrackets = [
    { label: '0-6 mos', min: 0, max: 6 },
    { label: '7-12 mos', min: 7, max: 12 },
    { label: '13-24 mos', min: 13, max: 24 },
    { label: '25-36 mos', min: 25, max: 36 },
    { label: '36+ mos', min: 37, max: 999 }
  ];

  const ageStmt = db.prepare(
    `SELECT AVG(resale_ratio) * 100 AS avgResalePercent
     FROM historical_transactions
     WHERE age_in_months BETWEEN ? AND ?`
  );

  const ageDepreciationTrends = ageBrackets.map((b) => {
    const row = ageStmt.get(b.min, b.max);
    const retention = Number(parseFloat(row?.avgResalePercent || 0).toFixed(1));
    return {
      ageGroup: b.label,
      avgResalePercent: retention,
      avgDepreciation: retention > 0 ? Number((100 - retention).toFixed(1)) : 0
    };
  });

  const bestValueRetainingCategory = categoryWiseInsights[0] || null;
  const highestDepreciatingCategory =
    categoryWiseInsights.length > 0
      ? categoryWiseInsights[categoryWiseInsights.length - 1]
      : null;

  return {
    totalHistoricalTransactions,
    averageResalePercentage,
    averageDepreciation,
    bestValueRetainingCategory,
    highestDepreciatingCategory,
    categoryWiseInsights,
    conditionWiseInsights,
    ageDepreciationTrends
  };
}

module.exports = {
  suggestFairPrice,
  getPricingInsights
};
