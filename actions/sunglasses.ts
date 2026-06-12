// Procedure layer for sunglasses table.

'use server'

import { prisma } from '@/services/prisma'

/**
 * PROCEDURE: sp_sunglasses_table
 * PURPOSE: Read all sunglass inventory metrics, sorting by primary key.
 * SELECT itemID, itemName, retailPrice, stockQuantity, isListed FROM Sunglasses;
 */
export async function getSunglassesTable() {
  try {
    return await prisma.sunglasses.findMany({
      orderBy: { itemID: 'asc' },
    })
  } catch {
    throw new Error('ERR_SUNGLASSES_FETCH_FAILED')
  }
}

/**
 * PROCEDURE: sp_create_sunglass
 * PARAMETERS: p_itemName, p_retailPrice, p_stockQuantity, p_isListed
 * INSERT INTO Sunglasses (itemName, retailPrice, stockQuantity, isListed) VALUES (:itemName_input, :retailPrice_input, :stockQuantity_input, :isListed_input);
 */
export async function createSunglass(
  p_itemName: string,
  p_retailPrice: number,
  p_stockQuantity: number,
  p_isListed: number
) {
  try {
    await prisma.sunglasses.create({
      data: {
        itemName: p_itemName,
        retailPrice: p_retailPrice,
        stockQuantity: p_stockQuantity,
        isListed: p_isListed,
      },
    })
    return { success: true }
  } catch {
    return { success: false, error: 'ERR_SUNGLASS_CREATE_FAILED' }
  }
}

/**
 * PROCEDURE: sp_update_sunglass
 * PARAMETERS: p_itemID, p_itemName, p_retailPrice, p_stockQuantity, p_isListed
 * UPDATE Sunglasses SET itemName = :itemName_input, retailPrice = :retailPrice_input, stockQuantity = :stockQuantity_input, isListed = :isListed_input WHERE itemID = :itemID_selected_from_sunglasses_page;
 */
export async function updateSunglass(
  p_itemID: number,
  p_itemName: string,
  p_retailPrice: number,
  p_stockQuantity: number,
  p_isListed: number
) {
  try {
    await prisma.sunglasses.update({
      where: { itemID: p_itemID },
      data: {
        itemName: p_itemName,
        retailPrice: p_retailPrice,
        stockQuantity: p_stockQuantity,
        isListed: p_isListed,
      },
    })
    return { success: true }
  } catch {
    return { success: false, error: 'ERR_SUNGLASS_UPDATE_FAILED' }
  }
}