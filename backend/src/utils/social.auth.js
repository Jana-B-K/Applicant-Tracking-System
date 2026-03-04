// import fetch from "node-fetch";

// export const parseName = (name = "") => {
//   const cleaned = String(name).trim();
//   if (!cleaned) return { firstName: "User", lastName: "Account" };
//   const [firstName = "User", ...rest] = cleaned.split(/\s+/);
//   const lastName = rest.join(" ") || "Account";
//   return { firstName, lastName };
// };

// export const fetchJson = async (url, accessToken) => {
//   const response = await fetch(url, {
//     method: "GET",
//     headers: { Authorization: `Bearer ${accessToken}` },
//   });
//   if (!response.ok) {
//     throw new Error("Invalid or expired social access token");
//   }
//   return response.json();
// };

// export const getGoogleProfile = async (accessToken) => {
//   const profile = await fetchJson(
//     "https://openidconnect.googleapis.com/v1/userinfo",
//     accessToken
//   );

//   if (!profile.email || !profile.email_verified) {
//     throw new Error("Google account email is missing or not verified");
//   }

//   return {
//     email: String(profile.email).toLowerCase(),
//     firstName: profile.given_name || parseName(profile.name).firstName,
//     lastName: profile.family_name || parseName(profile.name).lastName,
//   };
// };

// export const getMicrosoftProfile = async (accessToken) => {
//   const profile = await fetchJson(
//     "https://graph.microsoft.com/v1.0/me?$select=givenName,surname,displayName,mail,userPrincipalName",
//     accessToken
//   );

//   const email = profile.mail || profile.userPrincipalName;
//   if (!email) throw new Error("Microsoft account email is missing");

//   const parsedName = parseName(profile.displayName);

//   return {
//     email: String(email).toLowerCase(),
//     firstName: profile.givenName || parsedName.firstName,
//     lastName: profile.surname || parsedName.lastName,
//   };
// };

// export const getSocialProfile = async ({ provider, accessToken }) => {
//   if (provider === "google") return getGoogleProfile(accessToken);
//   if (provider === "microsoft") return getMicrosoftProfile(accessToken);
//   throw new Error("Unsupported social provider");
// };