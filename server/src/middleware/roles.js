export const onlyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

export const onlyChefeOrAdmin = (req, res, next) => {
  if (req.user.role !== 'chefe' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas chefes ou administradores.' });
  }
  next();
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Acesso negado. Requer role: ${roles.join(' ou ')}` 
      });
    }
    next();
  };
};
