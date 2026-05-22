const referralService =
  require("../services/referral.service");

exports.getReferralPrograms =
async (req, res) => {

  try {

    const riderId =
      req.rider?.id;

    const data =
      await referralService
        .getReferralPrograms(
          riderId
        );

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

exports.getReferralProgramsProgress =
async (req, res) => {

  try {

    const riderId =
      req.rider?.id;

    const data =
      await referralService
        .getReferralProgramsProgress(
          riderId
        );

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

exports.getReferrerList =
async (req, res) => {

  try {

    const riderId =
      req.rider?.id;

    const data =
      await referralService
        .getReferrerList(
          riderId
        );

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }

};