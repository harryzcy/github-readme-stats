import axios from "axios";

/**
 * Send GraphQL request to GitHub API.
 *
 * @param {import('axios').AxiosRequestConfig['data']} data Request data.
 * @param {import('axios').AxiosRequestConfig['headers']} headers Request headers.
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
      console.log("Fetch response status: " + resp.status);
      const text = await resp.text();
      console.log("Fetch response text: " + text);
      return {
        ...resp,
        data: JSON.parse(text),
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
