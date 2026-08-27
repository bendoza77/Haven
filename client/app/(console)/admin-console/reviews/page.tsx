import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ReviewsScreen from "@/components/console/ReviewsScreen";
import { consoles } from "@/lib/console";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("console");
  return { title: t("reviews.title"), description: t("meta.reviewsDescriptionAdmin") };
}

export default function AdminReviewsPage() {
  return <ReviewsScreen config={consoles.admin} />;
}
