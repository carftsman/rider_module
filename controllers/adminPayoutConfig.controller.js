const prisma = require("../config/prisma");

const createPayoutConfig = async (req, res) => {
    try {
        const {
            name,
            scenarioType,
            cityId,
            pincodeIds,
            vehicleType,
            basePay,
            perKmRate,
            surgeConfig,
            peakConfig,
            weatherConfig,
            notes,
            applicableFrom,
            applicableTill
        } = req.body;

        // ---------------- VALIDATION ----------------
        if (!scenarioType || !name) {
            return res.status(400).json({
                success: false,
                message: "scenarioType and name are required"
            });
        }

        if (!basePay || basePay <= 0) {
            return res.status(400).json({
                success: false,
                message: "Base pay must be greater than 0"
            });
        }

        if (perKmRate < 0) {
            return res.status(400).json({
                success: false,
                message: "perKmRate must be >= 0"
            });
        }

        if (!surgeConfig) {
            return res.status(400).json({
                success: false,
                message: "surgeConfig is required"
            });
        }
        if (applicableFrom && applicableTill) {
            if (new Date(applicableFrom) > new Date(applicableTill)) {
                return res.status(400).json({
                    success: false,
                    message: "applicableFrom cannot be greater than applicableTill"
                });
            }
        }

        // ---------------- CHECK EXISTING ----------------
        const existingConfig = await prisma.payoutConfig.findFirst({
            where: {
                cityId,
                scenarioType,
                vehicleType,
                isActive: true,
                pincodeIds: {
                    hasSome: pincodeIds
                }
            }
        });

        if (existingConfig) {
            return res.status(400).json({
                success: false,
                message:
                    "Config already exists for this segment. Delete or deactivate it before creating a new one.",
                data: {
                    existingConfigId: existingConfig.id
                }
            });
        }

        // ---------------- CREATE NEW CONFIG ----------------
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
                weatherConfig,
                version: 1, // static now
                isActive: true,
                notes,
                createdBy: "admin",
                applicableFrom: applicableFrom ? new Date(applicableFrom) : null,
                applicableTill: applicableTill ? new Date(applicableTill) : null
            }
        });

        // ---------------- RESPONSE ----------------
        return res.status(201).json({
            success: true,
            message: "Payout config created successfully",
            data: {
                configId: newConfig.id,
                version: newConfig.version,
                isActive: newConfig.isActive,
                scenarioType: newConfig.scenarioType,
                cityId: newConfig.cityId,
                createdAt: newConfig.createdAt,
                applicableFrom: newConfig.applicableFrom,
                applicableTill: newConfig.applicableTill
            }
        });

    } catch (error) {
        console.error("Create Payout Config Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    createPayoutConfig
};