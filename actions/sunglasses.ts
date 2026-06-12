// Procedure layer for sunglasses table.

'use server'

import { prisma } from '@/services/prisma'

/**
 * PROCEDURE: sp_sunglasses_table
 * PURPOSE: Read all sunglass inventory metrics, sorting by primary key.
 * SELECT itemID, itemName, retailPrice, stockQuantity, isListed, imagePath FROM Sunglasses;
 */
export async function getSunglassesTable() {
  try {
    const records = await prisma.sunglasses.findMany({
      orderBy: { itemID: 'asc' },
    })
    
    // Convert Decimal into string. Spreading (...item) automatically includes imagePath.
    return records.map(item => ({
      ...item,
      retailPrice: item.retailPrice.toString()
    }))
  } catch {
    throw new Error('ERR_SUNGLASSES_FETCH_FAILED')
  }
}

/**
 * PROCEDURE: sp_create_sunglasses
 * PARAMETERS: p_itemName, p_retailPrice, p_stockQuantity, p_isListed, p_imagePath
 */
export async function createSunglasses(
  p_itemName: string,
  p_retailPrice: number,
  p_stockQuantity: number,
  p_isListed: number,
  p_imagePath: string | null 
) {
  try {
    await prisma.sunglasses.create({
      data: {
        itemName: p_itemName,
        retailPrice: p_retailPrice,
        stockQuantity: p_stockQuantity,
        isListed: p_isListed,
        imagePath: p_imagePath, 
      },
    })
    return { success: true, error: null }
  } catch {
    return { success: false, error: 'ERR_SUNGLASS_CREATE_FAILED' }
  }
}

/**
 * PROCEDURE: sp_update_sunglasses
 * PARAMETERS: p_itemID, p_itemName, p_retailPrice, p_stockQuantity, p_isListed, p_imagePath
 */
export async function updateSunglasses(
  p_itemID: number,
  p_itemName: string,
  p_retailPrice: number,
  p_stockQuantity: number,
  p_isListed: number,
  p_imagePath: string | null 
) {
  try {
    await prisma.sunglasses.update({
      where: { itemID: p_itemID },
      data: {
        itemName: p_itemName,
        retailPrice: p_retailPrice,
        stockQuantity: p_stockQuantity,
        isListed: p_isListed,
        imagePath: p_imagePath, 
      },
    })
    return { success: true, error: null }
  } catch {
    return { success: false, error: 'ERR_SUNGLASS_UPDATE_FAILED' }
  }
}