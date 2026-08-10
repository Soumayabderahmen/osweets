import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gateaux/mariage-piece-montee")({
  beforeLoad: () => {
    throw redirect({ to: "/gateaux/wedding-cakes", statusCode: 301 });
  },
});
