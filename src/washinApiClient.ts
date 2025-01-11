import axios from "axios";
import * as fs from "fs";

const client = axios.create({
    baseURL: "https://mobile.kosmoshub.com/washin/",
    headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "WashIn/1005 CFNetwork/1568.200.51 Darwin/24.1.0"
    },
});

const constants = {
    client_id: "1_1881648594",
    client_secret: "A4f5d4gf59aT4566999999GHJ"
}

const endpoints = {
    token: "oauth/v2/token",
    profile: "api/profile",
    locations: "api/catalog/locations",
    currentBookings: "api/profile/current-bookings",
    currentOrders: "api/profile/current-orders",
    catalogLocations: "api/catalog/locations",
    infosForLoc: "api/catalog/menu", // Location ID is in headers
    washerDetails: "api/catalog/machines/1", // Location ID is in headers
    dryerDetails: "api/catalog/machines/2", // Again, location ID is in headers
}

let bearerToken: string | null = null;
let refreshToken: string | null = null;

const login = async (username: string, password: string) => {
    if (fs.existsSync(__dirname+"/tokens.json")) {
        // try tokens
        const tokens = JSON.parse(fs.readFileSync(__dirname+"/tokens.json").toString());
        bearerToken = tokens.bearerToken;
        refreshToken = tokens.refreshToken;
        try {
            // refresh
            await refresh();
            return tokens;
        } catch (e) {
            fs.unlinkSync(__dirname+"/tokens.json");
        }
    }
    const response = await client.post(endpoints.token, {
        username,
        password,
        client_id: constants.client_id,
        client_secret: constants.client_secret,
        grant_type: "password",
    });
    bearerToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    fs.writeFileSync(__dirname+"/tokens.json", JSON.stringify({
        bearerToken,
        refreshToken
    }));
    await refresh();
    return response.data;
}

let timeoutId: any = 0;

const refresh = async () => {
    clearTimeout(timeoutId);
    console.log("Refreshing token");
    if (!refreshToken) throw new Error("No refresh token");
    const response = await client.post(endpoints.token, {
        refresh_token: refreshToken,
        client_id: constants.client_id,
        client_secret: constants.client_secret,
        grant_type: "refresh_token",
    });
    bearerToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    fs.writeFileSync(__dirname+"/tokens.json", JSON.stringify({
        bearerToken,
        refreshToken
    }));
    timeoutId = setTimeout(refresh, response.data.expires_in * 1000);
    return response.data;
}

const getProfile = async () => {
    if (!bearerToken) throw new Error("No bearer token");
    const response = await client.get(endpoints.profile, {
        headers: {
            Authorization: `Bearer ${bearerToken}`
        }
    });
    return response.data;
}

const getAllLocations = async () => {
    if (!bearerToken) throw new Error("No bearer token");
    const response = await client.get(endpoints.locations, {
        headers: {
            Authorization: `Bearer ${bearerToken}`
        }
    });
    return response.data;
}

const getCurrentOrders = async () => {
    if (!bearerToken) throw new Error("No bearer token");
    const response = await client.get(endpoints.currentOrders, {
        headers: {
            Authorization: `Bearer ${bearerToken}`
        }
    });
    return response.data;
}

const getCurrentBookings = async () => {
    if (!bearerToken) throw new Error("No bearer token");
    const response = await client.get(endpoints.currentBookings, {
        headers: {
            Authorization: `Bearer ${bearerToken}`
        }
    });
    return response.data;
}

const getCatalogLocations = async () => {
    if (!bearerToken) throw new Error("No bearer token");
    const response = await client.get(endpoints.catalogLocations, {
        headers: {
            Authorization: `Bearer ${bearerToken}`
        }
    });
    return response.data;
}

const getInfosForLocation = async (locationId: string) => {
    if (!bearerToken) throw new Error("No bearer token");
    const response = await client.get(endpoints.infosForLoc, {
        headers: {
            Authorization: `Bearer ${bearerToken}`,
            Location: locationId
        }
    });
    return response.data;
}

const getWasherDetails = async (locationId: string) => {
    if (!bearerToken) throw new Error("No bearer token");
    const response = await client.get(endpoints.washerDetails, {
        headers: {
            Authorization: `Bearer ${bearerToken}`,
            Location: locationId
        }
    });
    return response.data;
}

const getDryerDetails = async (locationId: string) => {
    if (!bearerToken) throw new Error("No bearer token");
    const response = await client.get(endpoints.dryerDetails, {
        headers: {
            Authorization: `Bearer ${bearerToken}`,
            Location: locationId
        }
    });
    return response.data;
}

export default {
    login,
    refresh,
    getProfile,
    getAllLocations,
    getCurrentOrders,
    getCurrentBookings,
    getCatalogLocations,
    getInfosForLocation,
    getWasherDetails,
    getDryerDetails,
}