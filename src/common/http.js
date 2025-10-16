import axios from "axios";

/**
 * @typedef {import('axios').AxiosRequestConfig['data']} AxiosRequestConfigData Axios request data.
 * @typedef {import('axios').AxiosRequestConfig['headers']} AxiosRequestConfigHeaders Axios request headers.
 */

/**
 * Send GraphQL request to GitHub API.
 *
 * @param {AxiosRequestConfigData} data Request data.
 * @param {AxiosRequestConfigHeaders} headers Request headers.
 * @param {boolean=} useFetch Use fetch instead of axios.
 * @returns {Promise<any>} Request response.
 */
const request = (data, headers, useFetch = false) => {
  if (useFetch) {
    return fetch("https://api.github.com/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    }).then(async (resp) => {
      return {
        ...resp,
        data: await resp.json(),
      };
    });
  }

  return axios({
    url: "https://api.github.com/graphql",
    method: "post",
    headers,
    data,
  });
};

export { request };
