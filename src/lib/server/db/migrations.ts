
import { db } from './db';
import { createHandleMaskdCaFunction, createMaskdCaTrigger, initializeTriggers } from './schema';

export async function setupTriggers() {
    try {
        // Create the function first
        await db.execute(createHandleMaskdCaFunction);
        
        // Create and initialize triggers
        await db.execute(initializeTriggers);
        
        console.log('Successfully set up triggers and functions');
    } catch (error) {
        console.error('Error setting up triggers:', error);
    }
}