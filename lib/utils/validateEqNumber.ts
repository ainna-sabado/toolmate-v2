import { Tool } from "@/lib/models/Tool.model";
import { ToolKit } from "@/lib/models/ToolKit.model";

export async function validateEqNumberUnique(eqNumber: string) {
  if (!eqNumber) return;

  const existsInTools = await Tool.findOne({ eqNumber });
  const existsInKits = await ToolKit.findOne({ "contents.eqNumber": eqNumber });

  if (existsInTools || existsInKits) {
    throw new Error(`Duplicate eqNumber "${eqNumber}". Already exists.`);
  }
}
