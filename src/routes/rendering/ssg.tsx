import { createFileRoute } from "@tanstack/react-router";
import SsgDemo from "../../components/rendering/SsgDemo";

export const Route = createFileRoute("/rendering/ssg")({
  component: SsgDemo,
});
