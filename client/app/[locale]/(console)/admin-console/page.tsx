import OverviewScreen from "@/components/console/OverviewScreen";
import { consoles } from "@/lib/console";

/* No metadata here: a layout's title.template applies to its CHILD segments,
   not to its own page, so a title set here would bypass "%s · Admin console" and be fed
   through the root template instead. The layout's title.default already reads
   "Admin console", which is what this tab wants. */

export default function AdminOverviewPage() {
  return <OverviewScreen config={consoles.admin} />;
}
