const express = require("express");
const router = express.Router();
const key = require("../code");
const stripe = require("stripe")(key.keyStripe);

let dataBike = [
  {
    name: "BIKO45",
    img: "https://res.cloudinary.com/drnwmidu8/image/upload/v1600779006/bikeshop/bike-1_vdwbwg.jpg",
    price: 679,
    mea: true,
    noShipping: null,
    stock: 10,
  },
  {
    name: "ZOOK07",
    img: "https://res.cloudinary.com/drnwmidu8/image/upload/v1600779033/bikeshop/bike-2_ulohhs.jpg",
    price: 999,
    mea: false,
    noShipping: null,
    stock: 3,
  },
  {
    name: "TITANS",
    img: "https://res.cloudinary.com/drnwmidu8/image/upload/v1600779045/bikeshop/bike-3_dtol6i.jpg",
    price: 799,
    mea: true,
    noShipping: null,
    stock: 10,
  },
  {
    name: "CEWO",
    img: "https://res.cloudinary.com/drnwmidu8/image/upload/v1600779054/bikeshop/bike-4_wwaijz.jpg",
    price: 1300,
    mea: false,
    noShipping: null,
    stock: 10,
  },
  {
    name: "AMIG39",
    img: "https://res.cloudinary.com/drnwmidu8/image/upload/v1600779064/bikeshop/bike-5_s8lulm.jpg",
    price: 479,
    mea: true,
    noShipping: null,
    stock: 2,
  },
  {
    name: "LIK099",
    img: "https://res.cloudinary.com/drnwmidu8/image/upload/v1600779074/bikeshop/bike-6_mqngwt.jpg",
    price: 869,
    mea: false,
    noShipping: null,
    stock: 10,
  },
];
//========================== fonction calcul frais de port et montant total commande ====================================

const calculCommande = (databasket, modeLivraison) => {
  if (databasket.length === 0) {
    return { montantFraisPort: 0, totalCommande: 0 };
  }
  let totalCommande = 0;
  let fraisPort = modeLivraison.montant;

  for (let i = 0; i < databasket.length; i++) {
    totalCommande +=
      Number(databasket[i].quantity) * Number(databasket[i].price);
  }

  totalCommande += fraisPort;

  return { totalCommande, fraisPort };
};
// ===================================== fonction mode de livraison ====================================================================

const modeLivraison = (databasket) => {
  let totalCommande = 0;
  let nbItems = 0;

  for (let i = 0; i < databasket.length; i++) {
    nbItems += Number(databasket[i].quantity);
    totalCommande += databasket[i].quantity * databasket[i].price;
  }
  // ========================= règle standard========================

  let montantFraisPortStandard = nbItems * 30;

  if (totalCommande > 2000 && totalCommande < 4000) {
    montantFraisPortStandard /= 2;
  }
  if (totalCommande > 4000) {
    montantFraisPortStandard = 0;
  }
  // ========================== règle livraison express =========================

  let montantFraisPortExpress = montantFraisPortStandard + 100;

  // ========================= règle Point relay =====================

  let montantFraisPointrelay = nbItems * 20 + 50;

  let arrayModeLivraison = [
    {
      id: 1,
      name: "Standard shipping costs",
      montant: montantFraisPortStandard,
    },
    {
      id: 2,
      name: "Express delivery",
      montant: montantFraisPortExpress,
    },
    {
      id: 3,
      name: "Point relay shipping costs",
      montant: montantFraisPointrelay,
    },
  ];

  return arrayModeLivraison.sort((a, b) => a.montant - b.montant);
};
//=============================== fonction de mise en avant des produits =================================================================

const mea = (dataBike) => {
  let arrayMea = [];
  for (let i = 0; i < dataBike.length; i++) {
    if (dataBike[i].mea) {
      arrayMea.push(dataBike[i]);
    }
  }
  arrayMea = arrayMea.sort(function (a, b) {
    return a.price - b.price;
  });
  return arrayMea;
};
//=============================== GET home page. ===================
router.get("/", function (req, res, next) {
  if (req.session.dataBasket == undefined) {
    req.session.dataBasket = [];
  }

  res.render("index", {
    dataBike,
    mea: mea(dataBike),
  });
});
//====================== /method-livraison =========================
router.post("/method-livraison", function (req, res, next) {
  let modeLiv = modeLivraison(req.session.dataBasket);
  let selectedModeLivraison = modeLiv.find(
    (element) => element.id == req.body.modeLivraison
  );

  req.session.modeDeLivraison = selectedModeLivraison;
  res.redirect("/shop");
});
//=============================== /shop ==============================
router.get("/shop", function (req, res, next) {
  if (req.session.dataBasket == undefined) {
    req.session.dataBasket = [];
  }
  // ============================ listes des mode de livraisons==================================
  let listeModeLivraison = modeLivraison(req.session.dataBasket);

  // ================ par default, on propose le mode de livraison le moins cher ===============
  if (req.session.modeDeLivraison === undefined) {
    req.session.modeDeLivraison = listeModeLivraison[0];
  }

  req.session.modeDeLivraison = listeModeLivraison.find(
    (e) => e.id == req.session.modeDeLivraison.id
  );

  let total = calculCommande(
    req.session.dataBasket,
    req.session.modeDeLivraison
  );

  let totalCommande = total.totalCommande;

  res.render("shop", {
    dataBasket: req.session.dataBasket,
    selectedModeLivraison: req.session.modeDeLivraison,
    listeModeLivraison,
    totalCommande,
  });
});
// ==========================/add-shop============================
router.get("/add-shop", async function (req, res, next) {
  if (req.session.dataBasket == undefined) {
    req.session.dataBasket = [];
  }
  let bikeExist = false;

  for (let i = 0; i < req.session.dataBasket.length; i++) {
    if (req.session.dataBasket[i].name === req.query.name) {
      req.session.dataBasket[i].quantity =
        Number(req.session.dataBasket[i].quantity) + 1;
      bikeExist = true;
    }
  }

  if (bikeExist == false) {
    req.session.dataBasket.push({
      name: req.query.name,
      url: req.query.img,
      price: req.query.price,
      quantity: 1,
    });
  }

  res.redirect("/shop");
});
// ======================= /delete======================================

router.get("/delete", async function (req, res, next) {
  req.session.dataBasket.splice(req.query.deletePosition, 1);

  res.redirect("/shop");
});
// ============================= /update =================================
router.post("/update", async function (req, res, next) {
  req.session.dataBasket[req.body.position].quantity = Number(
    req.body.quantity
  );

  res.redirect("/shop");
});
//  ======================================= /success =========================
router.get("/success", function (req, res, next) {
  res.render("confirm");
});

//======================================= /create-checkout-session ====================
router.post("/create-checkout-session", async (req, res) => {
  if (req.session.dataBasket == undefined) {
    req.session.dataBasket = [];
  }

  let total = calculCommande(
    req.session.dataBasket,
    req.session.modeDeLivraison
  );

  let fraisPort = total.fraisPort;
  let stripeItems = [];

  for (let i = 0; i < req.session.dataBasket.length; i++) {
    stripeItems.push({
      price_data: {
        currency: "eur",
        product_data: {
          name: req.session.dataBasket[i].name,
        },
        unit_amount: req.session.dataBasket[i].price * 100,
      },
      quantity: req.session.dataBasket[i].quantity,
    });
  }
  //===================================== ajout frais de port ====================================================
  stripeItems.push({
    price_data: {
      currency: "eur",
      product_data: {
        name: "frais de port",
      },
      unit_amount: fraisPort * 100,
    },
    quantity: 1,
  });

  const session = await stripe.checkout.sessions.create({
    line_items: stripeItems,
    mode: "payment",
    success_url: "https://bikeshopexpress.herokuapp.com/success",
    cancel_url: "https://bikeshopexpress.herokuapp.com/",
  });

  res.redirect(303, session.url);
});
module.exports = router;
