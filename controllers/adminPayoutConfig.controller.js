const prisma = require("../config/prisma");

const getWeather =
  require("../utils/weather");

const createCityPayoutConfig =
  async (req, res) => {

    try {

      const {
        name,
        scenarioType,
        cityId,
        vehicleType,
        basePay,
        perKmRate,
        surgeConfig,
        peakConfig,
        weatherConfig,
        notes,
        latitude,
        longitude
      } = req.body;

    if (!name || !scenarioType) {
        return res.status(400).json({
          success: false,
          message: "name and scenarioType are required"
        });
      }

      if (!cityId) {
        return res.status(400).json({
          success: false,
          message: "cityId is required"
        });
      }

      if (!basePay || basePay <= 0) {
        return res.status(400).json({
          success: false,
          message: "basePay must be greater than 0"
        });
      }

      if (perKmRate < 0) {
        return res.status(400).json({
          success: false,
          message: "perKmRate must be >= 0"
        });
      }

      /**
       * WEATHER CHECK
       */

      let weatherResult = {
        isRaining: false
      };

      if (
        weatherConfig?.enabled &&
        latitude &&
        longitude
      ) {
        weatherResult = await getWeather(latitude, longitude);
      }

      const isWeatherEnabled =
        weatherConfig?.enabled &&
        weatherResult.isRaining;

      const finalWeatherConfig = {
        enabled: isWeatherEnabled || false,
        isRaining: weatherResult.isRaining,
        rainExtraPay: isWeatherEnabled
          ? weatherConfig?.rainExtraPay || 0
          : 0,
        multiplier: isWeatherEnabled
          ? weatherConfig?.multiplier || 1
          : 1
      };

    
      const lastConfig = await prisma.payoutConfig.findFirst({
  where: {
    cityId,
    scenarioType,
    vehicleType,
    pincodeIds: { isEmpty: true }
  },
  orderBy: { version: "desc" }
});

const newVersion = (lastConfig?.version || 0) + 1;


      await prisma.payoutConfig.updateMany({
  where: {
    cityId,
    scenarioType,
    vehicleType,
    isActive: true,
    pincodeIds: { isEmpty: true }
  },
  data: {
    isActive: false
  }
});

      const newConfig =
        await prisma.payoutConfig.create({
          data: {
            name,
            scenarioType,
            cityId,
            pincodeIds: [],
            vehicleType,
            basePay,
            perKmRate,
            surgeConfig,
            peakConfig,
            weatherConfig: finalWeatherConfig,
            notes,
            version: newVersion,
            isActive: true,
            createdBy: "admin"
          }
        });

      /**
       * RESPONSE (RETURN EXACT REQUEST BODY)
       */

      return res.status(201).json({
        success: true,
        data: req.body
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message: error.message
      });

    }

  };  
 //PINCODE LEVEL API
 

const createPincodePayoutConfig = async (req, res) => {
  try {
    const {
      name,
      scenarioType,
      cityId,
      pincodeIds = [],
      vehicleType,
      basePay,
      perKmRate,
      surgeConfig,
      peakConfig,
      weatherConfig,
      notes,
      latitude,
      longitude
    } = req.body;

    /**
     * VALIDATION
     */
    if (!cityId || !scenarioType || !vehicleType) {
      return res.status(400).json({
        success: false,
        message: "cityId, scenarioType, vehicleType are required"
      });
    }

    if (!pincodeIds.length) {
      return res.status(400).json({
        success: false,
        message: "pincodeIds are required"
      });
    }

    if (!basePay || basePay <= 0) {
      return res.status(400).json({
        success: false,
        message: "basePay must be greater than 0"
      });
    }

    if (perKmRate < 0) {
      return res.status(400).json({
        success: false,
        message: "perKmRate must be >= 0"
      });
    }

    /**
     * WEATHER LOGIC
     */
    let weatherResult = { isRaining: false };

    if (weatherConfig?.enabled && latitude && longitude) {
      weatherResult = await getWeather(latitude, longitude);
    }

    const isWeatherEnabled =
      weatherConfig?.enabled && weatherResult.isRaining;

    const finalWeatherConfig = {
      enabled: isWeatherEnabled || false,
      isRaining: weatherResult.isRaining,
      rainExtraPay: isWeatherEnabled ? weatherConfig?.rainExtraPay || 0 : 0,
      multiplier: isWeatherEnabled ? weatherConfig?.multiplier || 1 : 1
    };

    /**
     * GET LAST VERSION
     */
    const lastConfig = await prisma.payoutConfig.findFirst({
      where: {
        cityId,
        scenarioType,
        vehicleType,
        pincodeIds: { hasSome: pincodeIds }
      },
      orderBy: { version: "desc" }
    });

    const newVersion = (lastConfig?.version || 0) + 1;

    /**
     * DEACTIVATE OLD ACTIVE CONFIGS
     */
    await prisma.payoutConfig.updateMany({
      where: {
        cityId,
        scenarioType,
        vehicleType,
        isActive: true,
        pincodeIds: { hasSome: pincodeIds }
      },
      data: {
        isActive: false
      }
    });

    /**
     * CREATE NEW CONFIG
     */
    const newConfig = await prisma.payoutConfig.create({
      data: {
        name,
        scenarioType,
        cityId,
        pincodeIds,
        vehicleType,
        basePay,
        perKmRate,
        surgeConfig,
        peakConfig,
        weatherConfig: finalWeatherConfig,
        notes,
        version: newVersion,
        isActive: true,
        createdBy: "admin"
      }
    });

    return res.status(201).json({
      success: true,
      message: "Pincode config created successfully",
      data: newConfig
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
  const getActivePayoutConfig = async (req, res) => {
  try {
    const { cityId } = req.query;

    //  VALIDATION 
    if (!cityId) {
      return res.status(400).json({
        success: false,
        message: "cityId is required"
      });
    }

    const now = new Date();

    // FETCH ACTIVE CONFIG 
    const config = await prisma.payoutConfig.findFirst({
      where: {
        cityId,
        isActive: true,

        // DATE FILTER 
        AND: [
          {
            OR: [
              { applicableFrom: null },
              { applicableFrom: { lte: now } }
            ]
          },
          {
            OR: [
              { applicableTill: null },
              { applicableTill: { gte: now } }
            ]
          }
        ]
      },
      orderBy: {
        createdAt: "desc" 
      }
    });

    // NOT FOUND 
    if (!config) {
      return res.status(404).json({
        success: false,
        message: "No active config found for this city"
      });
    }

    //  SUCCESS RESPONSE 
    return res.status(200).json({
      success: true,
      data: {
        configId: config.id,
        scenarioType: config.scenarioType,
        name: config.name,

        cityId: config.cityId,
        pincodeIds: config.pincodeIds,

        vehicleType: config.vehicleType,

        basePay: config.basePay,
        perKmRate: config.perKmRate,

        surgeConfig: config.surgeConfig,
        peakConfig: config.peakConfig,
        weatherConfig: config.weatherConfig,

        version: config.version,
        isActive: config.isActive,
        createdAt: config.createdAt
      }
    });

  } catch (error) {
    console.error("Get Active Config Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


const getPayoutConfigHistory = async (req, res) => {

  try {

    const {
      cityId,
      scenarioType,
      type,
      pincode
    } = req.query;

    if (!cityId) {
      return res.status(400).json({
        success: false,
        message: "cityId is required"
      });
    }

    /**
     * FETCH ALL CITY RECORDS FIRST
     */

    let configs =
      await prisma.payoutConfig.findMany({
        where: {
          cityId,
          ...(scenarioType && { scenarioType })
        },
        orderBy: {
          createdAt: "desc"
        },
        select: {
          id: true,
          name: true,
          version: true,
          scenarioType: true,
          cityId: true,
          pincodeIds: true,
          vehicleType: true,
          basePay: true,
          perKmRate: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

    /**
     * FILTER CITY / PINCODE IN NODE JS
     * MUCH SAFER
     */

    if (type === "CITY") {

      configs = configs.filter(
        (cfg) =>
          !cfg.pincodeIds ||
          cfg.pincodeIds.length === 0
      );

    }

    if (type === "PINCODE") {

      configs = configs.filter(
        (cfg) =>
          cfg.pincodeIds &&
          cfg.pincodeIds.length > 0
      );

      if (pincode) {
        configs = configs.filter(
          (cfg) =>
            cfg.pincodeIds.includes(pincode)
        );
      }

    }

    /**
     * NO DATA
     */

    if (!configs.length) {
      return res.status(404).json({
        success: false,
        message: "No payout config history found"
      });
    }

    /**
     * RESPONSE
     */

    return res.status(200).json({
      success: true,
      total: configs.length,
      data: configs.map((cfg) => ({
        configId: cfg.id,

        type:
          cfg.pincodeIds?.length > 0
            ? "PINCODE"
            : "CITY",

        name: cfg.name,

        version: cfg.version,

        scenarioType: cfg.scenarioType,

        cityId: cfg.cityId,

        pincodeIds: cfg.pincodeIds,

        vehicleType: cfg.vehicleType,

        basePay: cfg.basePay,

        perKmRate: cfg.perKmRate,

        isActive: cfg.isActive,

        createdAt: cfg.createdAt,

        updatedAt: cfg.updatedAt

      }))
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

const updateBasePay = async (req, res) => {
  try {

    const { id } = req.params;
    const { basePay } = req.body;

    // VALIDATION
    if (!basePay || Number(basePay) <= 0) {
      return res.status(400).json({
        success: false,
        message: "basePay must be greater than 0"
      });
    }

    // CHECK EXISTING CONFIG
    const existingConfig =
      await prisma.payoutConfig.findUnique({
        where: { id }
      });

    if (!existingConfig) {
      return res.status(404).json({
        success: false,
        message: "Payout config not found"
      });
    }

    // UPDATE
    const updated =
      await prisma.payoutConfig.update({
        where: { id },
        data: {
          basePay: Number(basePay)
        }
      });

   return res.status(200).json({
  success: true,
  message: "Base pay updated successfully",
  data: {
    id: updated.id,
    basePay: updated.basePay
  }
});

  } catch (error) {

    console.log("UPDATE BASE PAY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};
const updateDistancePay = async (req, res) => {
  try {

    const { id } = req.params;
    const { perKmRate } = req.body;

    // VALIDATION
    if (perKmRate === undefined || Number(perKmRate) < 0) {
      return res.status(400).json({
        success: false,
        message: "perKmRate must be greater than or equal to 0"
      });
    }

    // CHECK CONFIG EXISTS
    const existingConfig =
      await prisma.payoutConfig.findUnique({
        where: { id }
      });

    if (!existingConfig) {
      return res.status(404).json({
        success: false,
        message: "Payout config not found"
      });
    }

    // UPDATE
    const updated =
      await prisma.payoutConfig.update({
        where: { id },
        data: {
          perKmRate: Number(perKmRate)
        }
      });

    return res.status(200).json({
  success: true,
  message: "Per KM rate updated successfully",
  data: {
    id: updated.id,
    perKmRate: updated.perKmRate
  }
});

  } catch (error) {

    console.log("UPDATE PER KM RATE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};
const updateSurgeConfig = async (req, res) => {
  try {

    const { id } = req.params;
    const { surgeConfig } = req.body;

    // CHECK CONFIG EXISTS
    const existingConfig =
      await prisma.payoutConfig.findUnique({
        where: { id }
      });

    if (!existingConfig) {
      return res.status(404).json({
        success: false,
        message: "Payout config not found"
      });
    }

    if (!surgeConfig) {
      return res.status(400).json({
        success: false,
        message: "surgeConfig is required"
      });
    }

    // EXISTING SURGE CONFIG
    const oldSurgeConfig =
      existingConfig.surgeConfig || {};

    // VALIDATIONS
    if (
      surgeConfig.multiplier !== undefined &&
      Number(surgeConfig.multiplier) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "multiplier must be > 0"
      });
    }

    if (
      surgeConfig.minLiveOrders !== undefined &&
      Number(surgeConfig.minLiveOrders) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "minLiveOrders must be >= 0"
      });
    }

    if (
      surgeConfig.extraPay !== undefined &&
      Number(surgeConfig.extraPay) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "extraPay must be >= 0"
      });
    }

    // MERGE OLD + NEW
    const finalSurgeConfig = {
      ...oldSurgeConfig,

      ...(surgeConfig.enabled !== undefined && {
        enabled: surgeConfig.enabled
      }),

      ...(surgeConfig.multiplier !== undefined && {
        multiplier: Number(surgeConfig.multiplier)
      }),

      ...(surgeConfig.minLiveOrders !== undefined && {
        minLiveOrders: Number(surgeConfig.minLiveOrders)
      }),

      ...(surgeConfig.extraPay !== undefined && {
        extraPay: Number(surgeConfig.extraPay)
      })
    };

    // UPDATE
    const updated =
      await prisma.payoutConfig.update({
        where: { id },
        data: {
          surgeConfig: finalSurgeConfig
        }
      });

    return res.status(200).json({
  success: true,
  message: "Surge config updated successfully",
  data: {
    id: updated.id,
    surgeConfig: updated.surgeConfig
  }
});
  } catch (error) {

    console.log("UPDATE SURGE CONFIG ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// const rollbackPayoutConfig = async (req, res) => {
//   try {

//     const { cityId } = req.query;

//     if (!cityId) {
//       return res.status(400).json({
//         success: false,
//         message: "cityId is required"
//       });
//     }

//     /**
//      * STEP 1: GET ALL CONFIGS (NO FILTER ON isActive)
//      */

//     const configs = await prisma.payoutConfig.findMany({
//       where: { cityId },
//       orderBy: {
//         createdAt: "desc"   // IMPORTANT: use createdAt, not updatedAt
//       }
//     });
//     console.log("CITY:", cityId);
// // console.log("PINCODE:", pincodeId || "NOT PROVIDED");
// console.log("COUNT:", configs.length);
// console.log("CONFIG IDS:", configs.map(c => c.id));
//     if (configs.length < 2) {
//       return res.status(400).json({
//         success: false,
//         message: "Not enough configs to rollback"
//       });
//     }

//     /**
//      * STEP 2: FIND CURRENT ACTIVE
//      */

//     const currentConfig = configs.find(c => c.isActive);

//     if (!currentConfig) {
//       return res.status(400).json({
//         success: false,
//         message: "No active config found"
//       });
//     }

//     /**
//      * STEP 3: FIND PREVIOUS (LAST INACTIVE BEFORE ACTIVE)
//      */

//     const previousConfig =
//       configs.find(c => c.id !== currentConfig.id);

//     if (!previousConfig) {
//       return res.status(400).json({
//         success: false,
//         message: "Previous config not found"
//       });
//     }

//     /**
//      * STEP 4: ROLLBACK
//      */

//     const result = await prisma.$transaction(async (tx) => {

//       await tx.payoutConfig.update({
//         where: { id: currentConfig.id },
//         data: { isActive: false }
//       });

//       return await tx.payoutConfig.update({
//         where: { id: previousConfig.id },
//         data: { isActive: true }
//       });

//     });

//     return res.status(200).json({
//       success: true,
//       message: "Rollback successful",
//       data: result
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };
const rollbackPayoutConfig = async (req, res) => {
  try {
    const { cityId } = req.query;

    if (!cityId) {
      return res.status(400).json({
        success: false,
        message: "cityId is required",
      });
    }

    /**
     * STEP 1: GET CURRENT ACTIVE CONFIG
     */
    const currentConfig = await prisma.payoutConfig.findFirst({
      where: {
        cityId,
        isActive: true,
      },
    });

    if (!currentConfig) {
      return res.status(400).json({
        success: false,
        message: "No active config found",
      });
    }

    /**
     * STEP 2: GET PREVIOUS VERSION (IMPORTANT FIX)
     */
    const previousConfig = await prisma.payoutConfig.findFirst({
  where: {
    cityId,
    
    version: { lt: currentConfig.version }
  },
  orderBy: {
    version: "desc"
  }
});

    if (!previousConfig) {
      return res.status(400).json({
        success: false,
        message: "No previous version found to rollback",
      });
    }

    /**
     * STEP 3: TRANSACTION ROLLBACK
     */
    const result = await prisma.$transaction(async (tx) => {
      // deactivate current
      await tx.payoutConfig.update({
        where: { id: currentConfig.id },
        data: { isActive: false },
      });

      // activate previous
      return await tx.payoutConfig.update({
        where: { id: previousConfig.id },
        data: { isActive: true },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Rollback successful",
      data: result,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const togglePayoutConfigStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // validation
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be boolean"
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const config = await tx.payoutConfig.findUnique({
        where: { id }
      });

      if (!config) {
        throw new Error("NOT_FOUND");
      }

      // Prevent disabling last active config
      if (config.isActive && isActive === false) {
        const activeCount = await tx.payoutConfig.count({
          where: {
            AND: [
              { cityId: config.cityId },
              { isActive: true }
            ]
          }
        });

        if (activeCount <= 1) {
          throw new Error("ONLY_ACTIVE");
        }
      }

      // If activating → deactivate others
      if (isActive === true) {
        await prisma.payoutConfig.updateMany({
  where: {
    cityId,
    scenarioType,
    vehicleType,
    isActive: true,
    pincodeIds: { isEmpty: true }
  },
  data: {
    isActive: false
  }
});
      }

      // Update this config
      const updated = await tx.payoutConfig.update({
        where: { id },
        data: { isActive }
      });

      return updated;
    });

    return res.json({
      success: true,
      message: "Config status updated",
      data: {
        configId: result.id,
        isActive: result.isActive,
        updatedAt: result.updatedAt
      },
      meta: {}
    });

  } catch (err) {
    console.error("TOGGLE ERROR:", err);

    if (err.message === "ONLY_ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Cannot deactivate the only active config"
      });
    }

    if (err.message === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Config not found"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update config status"
    });
  }
};
const updateWeatherConfig = async (req, res) => {
  try {

    const { id } = req.params;
    const { weatherConfig } = req.body;

    // CHECK CONFIG EXISTS
    const existingConfig =
      await prisma.payoutConfig.findUnique({
        where: { id }
      });

    if (!existingConfig) {
      return res.status(404).json({
        success: false,
        message: "Payout config not found"
      });
    }

    if (!weatherConfig) {
      return res.status(400).json({
        success: false,
        message: "weatherConfig is required"
      });
    }

    // EXISTING WEATHER CONFIG
    const oldWeatherConfig =
      existingConfig.weatherConfig || {};

    // VALIDATIONS
    if (
      weatherConfig.rainExtraPay !== undefined &&
      Number(weatherConfig.rainExtraPay) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "rainExtraPay must be >= 0"
      });
    }

    if (
      weatherConfig.multiplier !== undefined &&
      Number(weatherConfig.multiplier) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "multiplier must be > 0"
      });
    }

    // MERGE OLD + NEW
    const finalWeatherConfig = {
      ...oldWeatherConfig,

      ...(weatherConfig.enabled !== undefined && {
        enabled: weatherConfig.enabled
      }),

      ...(weatherConfig.isRaining !== undefined && {
        isRaining: weatherConfig.isRaining
      }),

      ...(weatherConfig.multiplier !== undefined && {
        multiplier: Number(weatherConfig.multiplier)
      }),

      ...(weatherConfig.rainExtraPay !== undefined && {
        rainExtraPay: Number(weatherConfig.rainExtraPay)
      })
    };

    // AUTO DISABLE IF NOT RAINING
    

    // UPDATE
    const updated =
      await prisma.payoutConfig.update({
        where: { id },
        data: {
          weatherConfig: finalWeatherConfig
        }
      });

    return res.status(200).json({
  success: true,
  message: "Weather config updated successfully",
  data: {
    id: updated.id,
    weatherConfig: {
      enabled: updated.weatherConfig.enabled,
      multiplier: updated.weatherConfig.multiplier,
      rainExtraPay: updated.weatherConfig.rainExtraPay
    }
  }
});
  } catch (error) {

    console.log("UPDATE WEATHER CONFIG ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};
//rider getsurgestatus
const getSurgeStatus = async (req, res) => {
  try {
    //  rider auth
    const riderId = req.rider?.id;

    if (!riderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    //  fetch rider location
    const rider = await prisma.rider.findUnique({
      where: {
        id: riderId,
      },
      select: {
        location: {
          select: {
            city: true,
            pincode: true,
          },
        },
      },
    });

    if (!rider || !rider.location) {
      return res.status(404).json({
        success: false,
        message: "Rider location not found",
      });
    }

    //  location values
    const cityId = rider.location.city;
    const pincode = rider.location.pincode;

    //  active config
    const config = await prisma.payoutConfig.findFirst({
      where: {
        isActive: true,
        pincodeIds: {
          has: pincode,
        },
      },
      orderBy: {
        version: "desc",
      },
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "No active config found",
      });
    }

    const surge = config.surgeConfig || {};

    // pincode validation
    const isPincodeAllowed =
      !config.pincodeIds?.length ||
      config.pincodeIds.includes(pincode);

    //  surge status
    const isSurgeActive =
      surge.enabled === true &&
      isPincodeAllowed;

    return res.status(200).json({
      success: true,
      data: {
        isSurgeActive,
        scenarioType: config.scenarioType,
        multiplier: isSurgeActive
          ? surge.multiplier
          : 1,
        minDemand: surge.minDemand || null,
      },
    });
  } catch (err) {
    console.error(" Surge Status Error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


const updatePincodePayoutConfig =
  async (req, res) => {

    try {

      const { configId } = req.params;

      const {
        name,
        scenarioType,
        cityId,
        pincodeIds = [],
        vehicleType,
        basePay,
        perKmRate,
        surgeConfig,
        peakConfig,
        weatherConfig,
        notes,
        latitude,
        longitude
      } = req.body;

      /**
       * CHECK EXISTING CONFIG
       */

      const existingConfig =
        await prisma.payoutConfig.findUnique({
          where: {
            id: configId
          }
        });

      if (!existingConfig) {
        return res.status(404).json({
          success: false,
          message: "Payout config not found"
        });
      }

      /**
       * VALIDATIONS
       */

      if (!pincodeIds.length) {
        return res.status(400).json({
          success: false,
          message: "pincodeIds are required"
        });
      }

      if (!basePay || basePay <= 0) {
        return res.status(400).json({
          success: false,
          message: "basePay must be greater than 0"
        });
      }

      if (perKmRate < 0) {
        return res.status(400).json({
          success: false,
          message: "perKmRate must be >= 0"
        });
      }

      /**
       * WEATHER CHECK
       */

      let weatherResult = {
        isRaining: false
      };

      if (
        weatherConfig?.enabled &&
        latitude &&
        longitude
      ) {
        weatherResult =
          await getWeather(latitude, longitude);
      }

      const isWeatherEnabled =
        weatherConfig?.enabled &&
        weatherResult.isRaining;

      const finalWeatherConfig = {
        enabled: isWeatherEnabled || false,
        isRaining: weatherResult.isRaining,
        rainExtraPay: isWeatherEnabled
          ? weatherConfig?.rainExtraPay || 0
          : 0,
        multiplier: isWeatherEnabled
          ? weatherConfig?.multiplier || 1
          : 1
      };

      /**
       * DUPLICATE CHECK
       */

      const duplicateConfig =
        await prisma.payoutConfig.findFirst({
          where: {
            id: {
              not: configId
            },
            cityId,
            scenarioType,
            vehicleType,
            isActive: true,
            pincodeIds: {
              hasSome: pincodeIds
            }
          }
        });

      if (duplicateConfig) {
        return res.status(400).json({
          success: false,
          message: "Another pincode config already exists",
          data: {
            existingConfigId: duplicateConfig.id
          }
        });
      }

      /**
       * UPDATE CONFIG
       */

      const updatedConfig =
        await prisma.payoutConfig.update({
          where: {
            id: configId
          },
          data: {
            name,
            scenarioType,
            cityId,
            pincodeIds,
            vehicleType,
            basePay,
            perKmRate,
            surgeConfig,
            peakConfig,
            weatherConfig: finalWeatherConfig,
            notes,
            version: existingConfig.version + 1,
            updatedAt: new Date()
          }
        });

      return res.status(200).json({
        success: true,
        message: "Pincode payout config updated successfully",
        data: updatedConfig
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message: error.message
      });

    }

  };

const updateCityPayoutConfig = async (req, res) => {

  try {

    const { configId } = req.params;

    const {
      name,
      scenarioType,
      cityId,
      vehicleType,
      basePay,
      perKmRate,
      surgeConfig,
      peakConfig,
      weatherConfig,
      notes,
      latitude,
      longitude
    } = req.body;

    /**
     * CHECK EXISTING CONFIG
     */

    const existingConfig =
      await prisma.payoutConfig.findUnique({
        where: { id: configId }
      });

    if (!existingConfig) {
      return res.status(404).json({
        success: false,
        message: "Payout config not found"
      });
    }

    /**
     * VALIDATIONS
     */

    if (!name || !scenarioType) {
      return res.status(400).json({
        success: false,
        message: "name and scenarioType are required"
      });
    }

    if (!cityId) {
      return res.status(400).json({
        success: false,
        message: "cityId is required"
      });
    }

    if (!basePay || basePay <= 0) {
      return res.status(400).json({
        success: false,
        message: "basePay must be greater than 0"
      });
    }

    if (perKmRate < 0) {
      return res.status(400).json({
        success: false,
        message: "perKmRate must be >= 0"
      });
    }

    /**
     * WEATHER CHECK
     */

    let weatherResult = {
      isRaining: false
    };

    if (
      weatherConfig?.enabled &&
      latitude &&
      longitude
    ) {
      weatherResult =
        await getWeather(latitude, longitude);
    }

    const isWeatherEnabled =
      weatherConfig?.enabled &&
      weatherResult.isRaining;

    const finalWeatherConfig = {
      enabled: isWeatherEnabled || false,
      isRaining: weatherResult.isRaining,
      rainExtraPay: isWeatherEnabled
        ? weatherConfig?.rainExtraPay || 0
        : 0,
      multiplier: isWeatherEnabled
        ? weatherConfig?.multiplier || 1
        : 1
    };

    /**
     * DUPLICATE CHECK
     */

    const duplicateConfig =
      await prisma.payoutConfig.findFirst({
        where: {
          id: {
            not: configId
          },
          cityId,
          scenarioType,
          vehicleType,
          isActive: true,
          pincodeIds: {
            isEmpty: true
          }
        }
      });

    if (duplicateConfig) {
      return res.status(400).json({
        success: false,
        message: "Another city config already exists",
        data: {
          existingConfigId: duplicateConfig.id
        }
      });
    }

    /**
     * UPDATE CONFIG
     */

    const updatedConfig =
      await prisma.payoutConfig.update({
        where: {
          id: configId
        },
        data: {
          name,
          scenarioType,
          cityId,
          vehicleType,
          basePay,
          perKmRate,
          surgeConfig,
          peakConfig,
          weatherConfig: finalWeatherConfig,
          notes,
          version: existingConfig.version + 1,
          updatedAt: new Date()
        }
      });

    return res.status(200).json({
      success: true,
      message: "City payout config updated successfully",
      data: updatedConfig
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

const getPayoutConfigs =
  async (req, res) => {

    try {
     const { cityId } = req.query;
      let whereCondition = {};
      if (cityId) {

        whereCondition.cityId = cityId;

      }

      const configs =
        await prisma.payoutConfig.findMany({

          where: whereCondition,

          orderBy: {
            createdAt: "desc"
          }

        });

      /**
       * CUSTOM RESPONSE
       */

      const formattedData =
        configs.map(config => ({

          configId:
            config.id,

          scenarioType:
            config.scenarioType,

          name:
            config.name,

          cityId:
            config.cityId,

          pincodeIds:
            config.pincodeIds,

          vehicleType:
            config.vehicleType,

          basePay:
            config.basePay,

          perKmRate:
            config.perKmRate,

          surgeConfig:
            config.surgeConfig,

          peakConfig:
            config.peakConfig,

          weatherConfig:
            config.weatherConfig,

          version:
            config.version,

          isActive:
            config.isActive,

          createdAt:
            config.createdAt

        }));

      return res.status(200).json({

        success: true,

        data: formattedData

      });

    } catch (error) {

      return res.status(500).json({

        success: false,

        message:
          error.message

      });

    }

  };

module.exports = {
  createPincodePayoutConfig,
   createCityPayoutConfig,
  getActivePayoutConfig,
  getPayoutConfigHistory,
  updateBasePay,
  updateSurgeConfig,
  updateDistancePay,
  rollbackPayoutConfig,
  togglePayoutConfigStatus,
  getSurgeStatus,
  updateCityPayoutConfig,
  updatePincodePayoutConfig,
  updateWeatherConfig,
  getPayoutConfigs
};