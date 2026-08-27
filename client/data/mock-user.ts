/**
 * What is left of the sample shopper.
 *
 * The account, the bag and the saved list are real — they live on the user
 * document in MongoDB and are read through the auth context. Orders and
 * addresses stay sample data because the store has no Order model and no
 * checkout that writes one yet; both screens are marked as samples in the UI.
 */

export type Order = {
  id: string;
  placedOn: string;
  status: "Delivered" | "In transit" | "Processing";
  itemCount: number;
  total: number;
};

export const orders: Order[] = [
  { id: "HVN-24917", placedOn: "12 August 2026", status: "In transit", itemCount: 3, total: 848 },
  { id: "HVN-24450", placedOn: "28 June 2026", status: "Delivered", itemCount: 1, total: 890 },
  { id: "HVN-23981", placedOn: "3 May 2026", status: "Delivered", itemCount: 2, total: 233 },
];

export type Address = {
  id: string;
  label: string;
  recipient: string;
  lines: string[];
  isDefault?: boolean;
};

export const addresses: Address[] = [
  {
    id: "home",
    label: "Home",
    recipient: "—",
    lines: ["44 Bridge Lane, Apt 6B", "Brooklyn, NY 11201", "United States"],
    isDefault: true,
  },
  {
    id: "studio",
    label: "Studio",
    recipient: "—",
    lines: ["210 Canal Street, Floor 3", "New York, NY 10013", "United States"],
  },
];
