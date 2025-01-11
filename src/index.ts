require('dotenv').config();

import {
    Client,
    EmbedBuilder,
    GatewayIntentBits,
    GuildTextBasedChannel,
    Partials,
    Events,
    AttachmentBuilder
} from "discord.js";
import Washin from "./washinApiClient";
import * as cron from "node-cron";

const notWorkingEmoji = "<:Broken:1327703098055200769>";
const workingEmoji = "<:Working:1327703085354848338>";

const allIntents = []
const allPartials = []

for (const key in GatewayIntentBits) {
    allIntents.push(GatewayIntentBits[key]);
}
for (const key in Partials) {
    allPartials.push(Partials[key]);
}

const client = new Client({
    intents: allIntents as any,
    partials: allPartials as any,
});

Washin.login(process.env.WASHIN_USERNAME as string, process.env.WASHIN_PASSWORD as string).then(() => {
    console.log("Logged in to Washin API");
});

cron.schedule("*/5 * * * *", async () => {
    console.log("Cron running.")
    const orders = await Washin.getCurrentOrders();
    for (const order of orders) {
        if (order.secLeft && order.secLeft <= 500 * 60) {
            const channel = await client.channels.fetch(process.env.NOTIFICATION_CHANNEL_ID as string) as GuildTextBasedChannel;
            const embed = new EmbedBuilder()
                .setTitle("Order almost ready")
                .setDescription(`Your order on ${order.name} has ${order.secLeft} seconds left. Get ready to pick it up!`)
                .setColor("#00FF00")
                .setFooter({
                    text: "Last API status time: "
                })
                .setTimestamp(new Date(order.lastApiStatusTime.date).getTime());
            channel.send({
                content: "@everyone",
                embeds: [embed]
            })
        }
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (message.author.id !== process.env.OWNER_ID) return;
    console.log("Message received", message.content);
    if (message.content === "!machines") {
        const washers = await Washin.getWasherDetails(process.env.WASHIN_LOCATION as string);
        const dryers = await Washin.getDryerDetails(process.env.WASHIN_LOCATION as string);

        const embed = new EmbedBuilder()
            .setTitle("Machines");
        for (const washer of washers) {
            embed.addFields({
                name: `**${washer.name}** » ${washer.isBroken ? notWorkingEmoji : workingEmoji}`,
                value: `${washer.statusName}
» ${washer.secLeft > 0 ? `${Math.floor(washer.secLeft / 60)} minutes left` : "Available"}
» ${washer.isReadyToStart ? "Ready to start" : "Not ready to start"}
» ${washer.isFinished ? "Finished" : "Not finished"}`,
                inline: true
            });
        }
        for (const dryer of dryers) {
            embed.addFields({
                name: `**${dryer.name}** » ${dryer.isBroken ? notWorkingEmoji : workingEmoji}`,
                value: `${dryer.statusName}
» ${dryer.secLeft > 0 ? `${Math.floor(dryer.secLeft / 60)} minutes left` : "Available"}
» ${dryer.isReadyToStart ? "Ready to start" : "Not ready to start"}
» ${dryer.isFinished ? "Finished" : "Not finished"}`,
                inline: true
            });
        }
        message.channel.send({
            embeds: [embed],
        });
    } else if (message.content === "!me") {
        const user = await Washin.getProfile();
        const embed = new EmbedBuilder()
            .setTitle(`:wave: Hi ${user.first_name} ${user.last_name}`)
            .setDescription(`:email: ${user.email}`)
            .addFields(
                {
                    name: "Are you a company ?",
                    value: user.isCompany ? "Yes!" : "No!",
                }
            );
        if (user.isCompany) {
            embed.addFields({
                name: "Company details",
                value: `» Name: ${user.company_name}
» Code: ${user.company_code}
» VAT: ${user.company_vat}`
            })
        }
        embed.addFields({
            name: "Address",
            value: user.address ? user.address : "No address found :("
        },
            {
                name: "Newsletter registration ?",
                value: user.newsletter ? "Yes" : "No"
            },
            {
                name: "Do Washin send you notifications? (in-app)",
                value: user.send_notifications ? "Yes" : "No"
            },
            {
                name: "Your default location id",
                value: `» ${user.default_location_id}`
            })
            .setTimestamp(new Date(user.registration_date.date))
            .setFooter({text: "Registered on"})

        message.channel.send({
            embeds: [embed]
        })
    }
})

client.login(process.env.DISCORD_TOKEN).then(() => {
    console.log("Logged in to Discord API");
});