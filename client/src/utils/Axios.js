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

    console.log('🔐 Axios interceptor - Request to:', config.url);
    console.log('🔐 Axios interceptor - Access token exists:', !!accessToken);
    console.log('🔐 Axios interceptor - Access token value:', accessToken ? accessToken.substring(0, 20) + '...' : 'null');

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log('🔐 Axios interceptor - Authorization header set to:', `Bearer ${accessToken.substring(0, 20)}...`);
      console.log('🔐 Axios interceptor - Final headers:', config.headers);
    } else {
      console.log('🔐 Axios interceptor - No access token found');
      console.log('🔐 Axios interceptor - localStorage content:', {
        accesstoken: localStorage.getItem('accesstoken'),
        refreshToken: localStorage.getItem('refreshToken'),
        isLoggedIn: localStorage.getItem('isLoggedIn'),
        allKeys: Object.keys(localStorage)
      });
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
    console.log('🔐 Axios response interceptor - Error status:', error.response?.status);
    console.log('🔐 Axios response interceptor - Error config:', error.config);

    let originRequest = error.config;

    if (error.response?.status === 401 && !originRequest.retry) {
      console.log('🔐 Axios response interceptor - Attempting token refresh');
      originRequest.retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      console.log('🔐 Axios response interceptor - Refresh token exists:', !!refreshToken);

      if (refreshToken) {
        const newAccessToken = await refreshAccessToken(refreshToken);
        console.log('🔐 Axios response interceptor - New access token obtained:', !!newAccessToken);

        if (newAccessToken) {
          originRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          console.log('🔐 Axios response interceptor - Retrying request with new token');
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

    const accessToken = response.data.accessToken;
    localStorage.setItem("accesstoken", accessToken);
    return accessToken;
  } catch (error) {
    console.log('Refresh token error:', error);
    return null;
  }
};

export default Axios;
