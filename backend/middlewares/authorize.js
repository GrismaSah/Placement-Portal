/**
 * Role gate. Always mount behind one of the guards in auth.js, which is what
 * puts `req.user` on the request.
 *
 * The `!req.user` branch is not reachable from any route today — every use is
 * paired with a guard — but it is one careless `router.post(path, authorizeRoles(...))`
 * away from being reachable, and in that state the old code read `.role` off
 * undefined and answered a 500. A missing user is a 401, not a crash.
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User Not Authorized",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user.role}) is not authorized to access this resource.`,
      });
    }
    next();
  };
};
