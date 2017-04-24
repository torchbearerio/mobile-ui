import {demoRoutes} from './testRoutes';

export const getDemoRoute = (routeKey) => {
  return demoRoutes[routeKey];
};

export const getDemoRoutes = () => {
  return demoRoutes;
};