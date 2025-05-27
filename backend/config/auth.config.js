module.exports = {
  secret: process.env.JWT_SECRET || 'e34aaef4c604376cab0329dfa150e060a2e67601835e118ae6518a5754923e7d',
  jwtExpiration: 86400 // 24 heures
};
