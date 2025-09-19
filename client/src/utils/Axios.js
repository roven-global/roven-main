import axios from "axios";
import SummaryApi, { baseURL } from "../common/summaryApi";

const Axios = axios.create({
  baseURL: baseURL,
  withCredentials: true,
});

//sending access token in the header
Axios.interceptors.request.use(
  async (config) => {
    const accessToken = localStorage.getItem("accesstoken");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

//extend the life span of access token with
// the help refresh
Axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    let originRequest = error.config;

    if (error.response?.status === 401 && !originRequest.retry) {
      originRequest.retry = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        const newAccessToken = await refreshAccessToken(refreshToken);

        if (newAccessToken) {
          originRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return Axios(originRequest);
        }
      }
    }

    return Promise.reject(error);
  }
);

const refreshAccessToken = async (refreshToken) => {
  try {
    // Use axios directly to avoid recursive interceptor calls
    const response = await axios({
      ...SummaryApi.refreshToken,
      baseURL: baseURL,
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    if (response.data.success && response.data.accessToken) {
      const accessToken = response.data.accessToken;
      localStorage.setItem("accesstoken", accessToken);
      return accessToken;
    } else {
      throw new Error("Invalid response from refresh token endpoint");
    }
  } catch (error) {
    console.error("Refresh token error:", error);
    // Clear stored tokens on refresh failure
    localStorage.removeItem("accesstoken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("isLoggedIn");

    // If refresh fails, the session is truly expired.
    // Dispatch an event that the App can listen to, to trigger a global logout.
    window.dispatchEvent(new Event("sessionExpired"));
    return null;
  }
};

export default Axios;
