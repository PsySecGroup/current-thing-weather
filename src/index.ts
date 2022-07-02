import { Command } from 'commander';

/**
 * Get tweets piped in from a CURL query
 * Split words and strip stop words
 * Extract domains
 * Extact times
 * Extract username
 * INSERT username TO users IF NOT UNIQUE
 * INSERT tweetId, users.id, timestamp TO tweetIds IF NOT UNIQUE
 * INSERT word, tweetId.id TO words
 *   IF (word, tweetId.id) EXISTS
 *     iterate counter by 1
 *   ELSE
 *     set counter to 1
 * INSERT domain, tweetId.id TO domains
 *   IF (domain, tweetId.id) EXISTS
 *     iterate counter by 1
 *   ELSE
 *     set counter to 1
 * Run queries to generate report
 * Create a report image
 */
