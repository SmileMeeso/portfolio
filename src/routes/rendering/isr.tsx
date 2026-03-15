import { createFileRoute } from "@tanstack/react-router";
import IsrDemo from "../../components/rendering/IsrDemo";

export const Route = createFileRoute("/rendering/isr")({
  component: IsrDemo,
});
