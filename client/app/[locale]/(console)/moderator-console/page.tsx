import OverviewScreen from "@/components/console/OverviewScreen";
import { consoles } from "@/lib/console";

/* No metadata here: a layout's title.template applies to its CHILD segments,
   not to its own page, so a title set here would bypass "%s · Moderator console" and be fed
   through the root template instead. The layout's title.default already reads
   "Moderator console", which is what this tab wants. */

export default function ModeratorOverviewPage() {
  return <OverviewScreen config={consoles.moderator} />;
}
