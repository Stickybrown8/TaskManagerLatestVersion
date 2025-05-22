// Service d'authentification pour les headers
export const getAuthHeader = (): { Authorization?: string } => {
  const token = localStorage.getItem('token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};
