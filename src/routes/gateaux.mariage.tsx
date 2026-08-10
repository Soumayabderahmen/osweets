import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gateaux/mariage")({
  beforeLoad: () => {
    throw redirect({ to: "/gateaux/wedding-cakes", statusCode: 301 });
  },
});
