import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gateaux/cakes")({
  beforeLoad: () => {
    throw redirect({ to: "/gateaux/gateaux-de-voyage", statusCode: 301 });
  },
});
