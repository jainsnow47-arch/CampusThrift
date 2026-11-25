// Little Loops: Deterministic, template-based item personality system (no external LLM)

const CATEGORY_MASCOTS = {
  Calculators: { emoji: '🧮', label: 'Calc Buddy' },
  Books: { emoji: '📚', label: 'Page Pal' },
  Cycles: { emoji: '🚲', label: 'Wheelie' },
  Electronics: { emoji: '💻', label: 'Sparky' },
  Furniture: { emoji: '🪑', label: 'DormMate' },
  'Lab Equipment': { emoji: '🧪', label: 'Beaker' },
  Other: { emoji: '🎒', label: 'Campus Kit' }
};

function formatAgePhrase(ageInMonths) {
  const months = Math.max(0, Number(ageInMonths) || 0);
  if (months < 3) return 'nearly brand new';
  if (months < 12) return `${months} months old`;
  const years = Math.round(months / 12);
  return years === 1 ? 'a year old' : `${years} years old`;
}

function formatSemesters(ageInMonths) {
  const sems = Math.max(1, Math.round((Number(ageInMonths) || 6) / 6));
  return sems === 1 ? 'one semester' : `${sems} semesters`;
}

function buildLittleLoop(listing) {
  const category = listing.category || 'Other';
  const type = String(listing.transactionType || 'SELL').toUpperCase();
  const condition = String(listing.condition || 'Good').toLowerCase();
  const agePhrase = formatAgePhrase(listing.ageInMonths);
  const semesters = formatSemesters(listing.ageInMonths);
  const mascot = CATEGORY_MASCOTS[category] || CATEGORY_MASCOTS.Other;

  let message = '';

  if (type === 'RENT') {
    const days = listing.maxDurationDays ? `${listing.maxDurationDays} days` : 'a week';
    message = `I'm only visiting your desk for up to ${days}! Take care of me and return me when you're done.`;
  } else if (type === 'BORROW') {
    const spot = listing.collectionLocation ? ` at ${listing.collectionLocation}` : ' on campus';
    message = `Borrow me for free${spot}, breeze through your week, and bring me back safe!`;
  } else if (type === 'SWAP') {
    const target = listing.swapFor ? listing.swapFor : 'something useful from your room';
    message = `I'm ${agePhrase} and up for a friendly swap—got ${target}?`;
  } else {
    switch (category) {
      case 'Cycles':
        message = `Hi! I'm a campus cycle. I'm ${agePhrase}, and I've still got plenty of rides left in me!`;
        break;
      case 'Books':
        message = `Hey! I've survived ${semesters} on campus. Ready to help you survive yours?`;
        break;
      case 'Calculators':
        message = `Psst! Exams are coming. I'm in ${condition} shape and ready for those equations.`;
        break;
      case 'Electronics':
        message = `Charged up and ${condition}! I'm ${agePhrase} and ready for your late-night projects.`;
        break;
      case 'Furniture':
        message = `I've held textbooks and midnight chai for ${agePhrase}—plenty of dorm comfort left!`;
        break;
      case 'Lab Equipment':
        message = `Lab-tested and ${condition}! Ready to help you ace Monday morning practicals.`;
        break;
      default:
        message = `Campus-tested for ${agePhrase} and in ${condition} condition—ready for a new dorm!`;
        break;
    }
  }

  return {
    emoji: mascot.emoji,
    name: mascot.label,
    message
  };
}

module.exports = {
  buildLittleLoop
};
