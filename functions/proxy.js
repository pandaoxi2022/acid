const fetch = require("node-fetch");

exports.handler = async (event, context) => {
	// 只允许 GET 请求
	if (event.httpMethod !== "GET") {
		return { statusCode: 405, body: "Method Not Allowed" };
	}

	// 获取要代理的 URL
	const url = event.queryStringParameters.url;

	if (!url) {
		return { statusCode: 400, body: "Missing URL parameter" };
	}

	try {
		// 设置请求头以绕过常见的防盗链
		const headers = {
			Referer: new URL(url).origin,
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
			Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
			"Accept-Language": "en-US,en;q=0.9",
		};

		// 发起请求
		const response = await fetch(url, { headers });

		if (!response.ok) {
			return {
				statusCode: response.status,
				body: `Error fetching resource: ${response.statusText}`,
			};
		}

		// 获取内容类型
		const contentType =
			response.headers.get("content-type") || "application/octet-stream";

		// 返回响应
		return {
			statusCode: 200,
			headers: {
				"Content-Type": contentType,
				"Access-Control-Allow-Origin": "*",
				"Cache-Control": "public, max-age=86400", // 缓存一天
			},
			body: await response.buffer().then((b) => b.toString("base64")),
			isBase64Encoded: true,
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: `Internal Server Error: ${error.message}`,
		};
	}
};
