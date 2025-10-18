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
      const text = await resp.text();
      return {
        ...resp,
        text: await resp.text(),
        data: JSON.parse(text),
      };
    });
  }

  // return axios({
  //   url: "https://api.github.com/graphql",
  //   method: "post",
  //   headers,
  //   data,
  // });
  throw new Error("Axios requests are disabled.");
};

export { request };
