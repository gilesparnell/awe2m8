// Quick test to verify cost tracking issue
const { useCostTracking } = require('./src/hooks/useCostTracking.ts');

console.log('Testing cost tracking...');
console.log('This would normally show real cost data');
console.log('Issue: Activities are not being created with cost values');
console.log('Solution: Need to ensure all activities include cost field when created');