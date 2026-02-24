exports.calculateDeliveryCharge = ({ distanceKm, loadKg }) => {
  const BASE_FEE = 500;
  const RATE_PER_KM = 50;
  const RATE_PER_KG = 20;

  return (
    BASE_FEE +
    distanceKm * RATE_PER_KM +
    loadKg * RATE_PER_KG
  );
};
