import axios from "axios";

/**
 * Send GraphQL request to GitHub API.
 *
 * @param {import('axios').AxiosRequestConfig['data']} data Request data.
 * @param {import('axios').AxiosRequestConfig['headers']} headers Request headers.
 * @param {boolean=} useFetch Use fetch instead of axios.
 * @returns {Promise<any>} Request response.
 */
const request = async (data, headers, useFetch = false) => {
  if (useFetch) {
    if (!headers["User-Agent"]) {
      headers["User-Agent"] = "github-readme-stats";
    }
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    const text = await response.text();
    let responseData = {};
    try {
      responseData = JSON.parse(text);
    } catch (e) {
      // ignore JSON parse errors
    }
    return {
      ...response,
      text,
      data: responseData,
    };
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
