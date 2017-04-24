Number.prototype.toRad = function() {
    return this * Math.PI / 180;
}

export const distance = (p1, p2) => {
  const dlon = (p2.long - p1.long).toRad();
  const dlat = (p2.lat - p1.lat).toRad();
  const a = Math.sin(dlat/2) * Math.sin(dlat/2) +
        Math.cos(p1.lat.toRad()) * Math.cos(p2.lat.toRad()) *
        Math.sin(dlon/2) * Math.sin(dlon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const R = 20900000;
  return R * c;


};

export const arrayMax = (arr) => {
  return Math.max.apply(null, arr);
};
