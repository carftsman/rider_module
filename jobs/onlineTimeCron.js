const cron = require("node-cron");

const prisma = require("../config/prisma");

const {
  riderSockets,
} = require("../webSocket");

cron.schedule("* * * * *", async () => {

  try {

    console.log("⏱ Online cron running");

    const now = new Date();

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const riderStatuses =
      await prisma.riderStatus.findMany({

        where: {
          isOnline: true,
        },
      });

    for (const riderStatus of riderStatuses) {

      const riderId = riderStatus.riderId;

      // CHECK SOCKET EXISTS
      const socket =
        riderSockets.get(String(riderId));

      // IF SOCKET NOT CONNECTED
      if (!socket) {

        console.log(
          ` Rider socket missing ${riderId}`
        );

        continue;
      }

      // SOCKET DEAD
      if (
        socket.readyState !== 1
      ) {

        console.log(
          ` Socket closed ${riderId}`
        );

        continue;
      }

      let totalMinutes =
        riderStatus.totalOnlineMinutesToday || 0;

      // DAILY RESET
      const savedDate =
        riderStatus.onlineMinutesDate
          ? new Date(
              riderStatus.onlineMinutesDate
            )
          : null;

      if (
        !savedDate ||
        savedDate.getTime() !== today.getTime()
      ) {

        totalMinutes = 0;
      }

      const lastCalculatedAt =
        riderStatus.lastCalculatedAt
          ? new Date(
              riderStatus.lastCalculatedAt
            )
          : new Date(
              riderStatus.lastLoginAt
            );

      const diffMs =
        now - lastCalculatedAt;

      const minutes =
        Math.floor(diffMs / 60000);

      if (minutes <= 0) {
        continue;
      }

      await prisma.riderStatus.update({

        where: {
          riderId,
        },

        data: {

          totalOnlineMinutesToday:
            totalMinutes + minutes,

          lastCalculatedAt: now,

          onlineMinutesDate: today,
        },
      });

      console.log(
        ` Rider ${riderId} +${minutes} mins`
      );
    }

  } catch (err) {

    console.log(
      "ONLINE CRON ERROR:",
      err.message
    );
  }

});