export type ServiceCategory = "Hair" | "Nails" | "Skin" | "Body" | "Makeup";

export type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  category: ServiceCategory;
  image: string;
};

export const services: Service[] = [
  {
    id: "haircut-styling",
    name: "Haircut & Styling",
    description:
      "A precision cut, wash and blow-dry finish tailored to your face shape and personal style.",
    price: 35,
    duration: "45 min",
    category: "Hair",
    image: "/services/haircut.svg",
  },
  {
    id: "hair-coloring",
    name: "Hair Colouring",
    description:
      "Vivid, long-lasting colour — highlights, balayage or a complete transformation.",
    price: 75,
    duration: "90 min",
    category: "Hair",
    image: "/services/coloring.svg",
  },
  {
    id: "beard-grooming",
    name: "Beard Grooming",
    description:
      "A sharp trim, clean line-up and hot-towel finish to keep your beard looking its best.",
    price: 25,
    duration: "30 min",
    category: "Hair",
    image: "/services/beard.svg",
  },
  {
    id: "classic-manicure",
    name: "Classic Manicure",
    description:
      "Shape, buff, cuticle care and a flawless polish of your choice for beautiful hands.",
    price: 30,
    duration: "40 min",
    category: "Nails",
    image: "/services/manicure.svg",
  },
  {
    id: "relaxing-pedicure",
    name: "Relaxing Pedicure",
    description:
      "A soothing soak, gentle exfoliation and nail care that leaves your feet feeling fresh.",
    price: 40,
    duration: "50 min",
    category: "Nails",
    image: "/services/pedicure.svg",
  },
  {
    id: "glow-facial",
    name: "Glow Facial",
    description:
      "A deep-cleansing facial that hydrates, brightens and revives tired, dull skin.",
    price: 55,
    duration: "60 min",
    category: "Skin",
    image: "/services/facial.svg",
  },
  {
    id: "full-body-massage",
    name: "Full Body Massage",
    description:
      "A gentle, tension-melting massage that relaxes your muscles and clears your mind.",
    price: 70,
    duration: "60 min",
    category: "Body",
    image: "/services/massage.svg",
  },
  {
    id: "makeup-artistry",
    name: "Makeup Artistry",
    description:
      "Flawless makeup for weddings, parties or a night out — camera-ready every time.",
    price: 60,
    duration: "55 min",
    category: "Makeup",
    image: "/services/makeup.svg",
  },
];

export const serviceCategories = [
  "All",
  "Hair",
  "Nails",
  "Skin",
  "Body",
  "Makeup",
] as const;
