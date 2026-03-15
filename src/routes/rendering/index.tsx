import { createFileRoute } from "@tanstack/react-router";
import RenderingIndex from "../../components/rendering/RenderingIndex";

export const Route = createFileRoute("/rendering/")({
  component: RenderingIndex,
});
