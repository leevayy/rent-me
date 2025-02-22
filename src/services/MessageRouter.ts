import { Context, NarrowedContext } from "telegraf";
import { Message, Update } from "telegraf/types";

export type MessageContext = NarrowedContext<
	Context<Update>,
	Update.MessageUpdate<Message>
>;

type RouteType = "default" | "text";

type BaseRouteParams = {
	type: "text";
	path: string;
	handler: (
		ctx: MessageContext,
	) => void;
} | {
	type: "default";
	handler: (
		ctx: MessageContext,
	) => void;
};

type RouteParams = BaseRouteParams;

export type Routes = RouteParams[];

const initRouter = (routes: Routes) => {
	return (ctx: MessageContext) => {
		const baseMatchRoute = (routes: Routes, text: string | undefined) =>
			((text !== undefined) &&
				routes.find((route) => route.type === "text" && route.path === text)) ||
			routes.find((route) => route.type === "default");

		const route = baseMatchRoute(routes, ctx.text);

		if (route) {
			return route.handler(ctx);
		}
	};
};

export const createMessageRouter = (routes: Routes) => {
	const router = initRouter(routes);

	return router;
};
