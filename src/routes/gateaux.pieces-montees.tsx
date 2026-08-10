import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gateaux/pieces-montees")({
  beforeLoad: () => {
    throw redirect({ to: "/gateaux/wedding-cakes", statusCode: 301 });
  },
});
