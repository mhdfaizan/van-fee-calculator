window.VFC = window.VFC || {};

VFC.Calculations = {
  calcFuelUsed(km, mileage) {
    if (!mileage || mileage === 0) return 0;
    return km / mileage;
  },

  calcFuelCost(fuelUsed, petrolPrice) {
    return fuelUsed * petrolPrice;
  },

  calcBaseFuelCost(fuelUsed, basePrice) {
    return fuelUsed * basePrice;
  },

  calcExtraFuel(fuelCost, baseCost) {
    return fuelCost - baseCost;
  },

  calcDay(dayData, settings) {
    if (!dayData || !dayData.working) {
      return {
        fuelUsed: 0, fuelCost: 0, baseFuelCost: 0, extraFuelCost: 0,
        km: dayData ? (dayData.kmDriven || 0) : 0,
        passengers: dayData ? (dayData.passengers || 0) : 0,
        petrolPrice: dayData ? (dayData.petrolPrice || 0) : 0
      };
    }
    const km = dayData.kmDriven || 0;
    const passengers = dayData.passengers || 0;
    const petrolPrice = dayData.petrolPrice || 0;
    const fuelUsed = this.calcFuelUsed(km, settings.mileage);
    const fuelCost = this.calcFuelCost(fuelUsed, petrolPrice);
    const baseFuelCost = this.calcBaseFuelCost(fuelUsed, settings.basePetrolPrice);
    const extraFuelCost = this.calcExtraFuel(fuelCost, baseFuelCost);
    return { fuelUsed, fuelCost, baseFuelCost, extraFuelCost, km, passengers, petrolPrice };
  },

  calcMonth(dailyData, settings) {
    let workingDays = 0, totalKm = 0, totalFuelUsed = 0, totalFuelCost = 0;
    let totalBaseFuelCost = 0, totalExtraFuelCost = 0, totalPassengers = 0;
    let priceSum = 0, priceCount = 0;

    for (const key in dailyData) {
      const day = dailyData[key];
      if (!day.working) continue;
      workingDays++;
      totalKm += day.kmDriven || 0;
      totalPassengers += day.passengers || 0;
      if (day.petrolPrice > 0) { priceSum += day.petrolPrice; priceCount++; }
      const fuelUsed = this.calcFuelUsed(day.kmDriven || 0, settings.mileage);
      totalFuelUsed += fuelUsed;
      totalFuelCost += this.calcFuelCost(fuelUsed, day.petrolPrice || 0);
      totalBaseFuelCost += this.calcBaseFuelCost(fuelUsed, settings.basePetrolPrice);
    }

    totalExtraFuelCost = totalFuelCost - totalBaseFuelCost;
    const avgPrice = priceCount > 0 ? priceSum / priceCount : 0;
    const revisedFee = settings.monthlyFee + Math.max(0, totalExtraFuelCost);
    const avgPassengers = workingDays > 0 ? totalPassengers / workingDays : 0;
    const perPassengerFee = avgPassengers > 0 ? revisedFee / avgPassengers : 0;

    return {
      workingDays,
      totalKm,
      totalFuelUsed,
      avgPetrolPrice: avgPrice,
      totalFuelCost,
      totalBaseFuelCost,
      totalExtraFuelCost: Math.max(0, totalExtraFuelCost),
      originalFee: settings.monthlyFee,
      revisedFee,
      perPassengerFee,
      avgPassengers
    };
  }
};
