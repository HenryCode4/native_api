import cron from "cron";
import https from "https";

const job = new cron.CronJob("*/14 * * * *", function () {
    https
        .get(process.env.API_URL, (res) => {
            if(res.statusCode === 200) console.log("GET request sent successfully");
            else console.log("Error sending GET request");
        })
        .on("error", (e) => console.error(`Got error: ${e.message}`));

        console.log(process.env.API_URL);
});

export default job;



