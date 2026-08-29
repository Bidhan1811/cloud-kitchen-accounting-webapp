import { Router } from "express";
import healthRouter from "./health.routes.js";
import authRouter from "./auth.routes.js";
import menuRouter from "./menu.routes.js";
import saleRouter from "./sale.routes.js";
import expenditureRouter from "./expenditure.routes.js";
import customerRouter from "./customer.routes.js";
import ledgerRouter from "./ledger.routes.js";
import dashboardRouter from "./dashboard.routes.js";
import voiceRouter from "./voice.routes.js"

const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/menu", menuRouter);
router.use("/sales", saleRouter);
router.use("/expenditures", expenditureRouter);
router.use("/customers", customerRouter);
// Mounted at the same base as customerRouter — ledger.routes.js defines
// paths like "/:customerId/ledger", so together this resolves to
// /api/v1/customers/:customerId/ledger, matching the spec's suggested
// endpoint shape (section 35) and keeping the credit ledger conceptually
// nested under Customers rather than as a separate top-level resource, per
// spec section 28 ("do not create a separate Credit Account Dashboard").
router.use("/customers", ledgerRouter);
router.use("/dashboard", dashboardRouter);
router.use("/voice", voiceRouter);

export default router;