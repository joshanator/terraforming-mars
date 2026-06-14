<template>
  <div :class="'topmost-'+screen">
    <section>
      <dialog id="alert-dialog" class="alert-dialog">
        <form method="dialog">
          <p id="alert-title" class="title" v-i18n>Error with input</p>
          <p id="alert-dialog-message"></p>
          <menu class="dialog-menu centered-content">
            <button id="alert-dialog-button" class="btn btn-lg btn-primary">OK</button>
          </menu>
        </form>
      </dialog>
    </section>
    <div class="main-container">
      <StartScreen v-if="screen === 'start-screen'"/>
      <CreateGameForm
        v-else-if="screen === 'create-game-form'"
      />
      <LoadGameForm v-else-if="screen === 'load'"/>
      <GameHome
        v-else-if="screen === 'game-home' && game !== undefined"
        :game="game"
      />
      <PlayerHome
        v-else-if="screen === 'player-home' && playerView !== undefined"
        :player-view="playerView"
        :key="playerkey"
      />
      <SpectatorHome
        v-else-if="screen === 'spectator-home' && spectator !== undefined"
        :spectator="spectator"
        :key="'spectator-' + playerkey"
      />
      <GameEnd
        v-else-if="screen === 'the-end'"
        :player-view="playerView"
        :spectator="spectator"
      />
      <GamesOverview
        v-else-if="screen === 'games-overview'"
      />
      <CardList v-else-if="screen === 'cards'"/>
      <AdminHome v-else-if="screen === 'admin'"/>
      <LoginHome v-else-if="screen === 'login-home'"/>
      <Help v-else-if="screen === 'help'"/>
      <div v-else-if="screen === 'roguelike'" style="background: #1a1a2e; padding: 40px; min-height: 100vh; color: white;">
        <h1 style="font-size: 36px; margin-bottom: 10px;">Terraforming Mars</h1>
        
        <!-- Profile Selection -->
        <div v-if="!roguelikeSelectedProfile">
          <p style="color: #aaa; margin-bottom: 30px;">Solo roguelike with persistent progression</p>
          
          <div style="margin-bottom: 30px;">
            <input v-model="roguelikeNewName" placeholder="New profile name" style="padding: 12px; font-size: 16px; border-radius: 4px; border: 1px solid #555; background: #333; color: white; width: 300px;"/>
            <button @click="createRoguelikeProfile" style="padding: 12px 24px; margin-left: 10px; background: #f4a460; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Create Profile</button>
          </div>
          
          <div v-if="roguelikeProfiles.length > 0">
            <h3 style="color: #f4a460; margin-bottom: 15px;">Select Profile</h3>
            <div v-for="p in roguelikeProfiles" :key="p.id" @click="selectRoguelikeProfile(p)" style="display: flex; align-items: center; justify-content: space-between; padding: 20px; border: 1px solid #444; margin: 10px 0; border-radius: 8px; background: rgba(255,255,255,0.05); cursor: pointer;" onmouseover="this.style.borderColor='#f4a460'" onmouseout="this.style.borderColor='#444'">
              <div>
                <div style="font-size: 20px; font-weight: bold;">{{ p.name }}</div>
                <div style="color: #aaa; margin-top: 5px;">Level {{ roguelikeLevel(p) }} | {{ p.totalXP }} XP | {{ p.ascensionNodes || 0 }} ascensions | {{ p.stats?.totalWins || 0 }}/{{ p.stats?.totalRuns || 0 }} wins</div>
              </div>
              <button @click.stop="deleteRoguelikeProfile(p)" style="padding: 8px 14px; background: transparent; border: 1px solid #a33; color: #e88; border-radius: 4px; cursor: pointer; font-weight: bold; flex-shrink: 0; margin-left: 15px;" onmouseover="this.style.background='#a33'; this.style.color='#fff';" onmouseout="this.style.background='transparent'; this.style.color='#e88';">Delete</button>
            </div>
          </div>
        </div>
        
        <!-- Profile Dashboard -->
        <div v-else>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <span style="font-size: 24px; font-weight: bold;">{{ roguelikeSelectedProfile.name }}</span>
              <button @click="roguelikeSelectedProfile = null" style="margin-left: 15px; padding: 5px 10px; background: transparent; border: 1px solid #666; color: #aaa; border-radius: 4px; cursor: pointer;">Change Profile</button>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 24px; color: #f4a460;">Level {{ roguelikeLevelProgress().level }}</div>
              <div style="color: #7d7;">{{ roguelikeAvailablePoints }} upgrade point(s) available</div>
              <div style="color: #aaa; font-size: 13px; margin-top: 2px;">
                {{ roguelikeLevelProgress().xpIntoCurrentLevel }} / {{ roguelikeLevelProgress().xpForNextLevel }} XP to next level
                ({{ roguelikeSelectedProfile.totalXP }} total)
              </div>
              <div style="width: 180px; height: 6px; background: #333; border-radius: 3px; margin-top: 4px; margin-left: auto; overflow: hidden;">
                <div :style="'height: 100%; background: #f4a460; width: ' + Math.min(100, Math.round(100 * roguelikeLevelProgress().xpIntoCurrentLevel / roguelikeLevelProgress().xpForNextLevel)) + '%;'"></div>
              </div>
            </div>
          </div>
          
          <!-- Tabs -->
          <div style="display: flex; gap: 5px; margin-bottom: 20px; border-bottom: 1px solid #444; padding-bottom: 10px;">
            <button @click="roguelikeTab = 'upgrades'" :style="'padding: 10px 20px; border: none; border-radius: 4px 4px 0 0; cursor: pointer;' + (roguelikeTab === 'upgrades' ? 'background: #f4a460; color: #000;' : 'background: #333; color: #aaa;')">Upgrades</button>
            <button @click="roguelikeTab = 'cards'" :style="'padding: 10px 20px; border: none; border-radius: 4px 4px 0 0; cursor: pointer;' + (roguelikeTab === 'cards' ? 'background: #f4a460; color: #000;' : 'background: #333; color: #aaa;')">Cards</button>
            <button @click="roguelikeTab = 'ascension'" :style="'padding: 10px 20px; border: none; border-radius: 4px 4px 0 0; cursor: pointer;' + (roguelikeTab === 'ascension' ? 'background: #f4a460; color: #000;' : 'background: #333; color: #aaa;')">Ascension</button>
            <button @click="roguelikeTab = 'stats'" :style="'padding: 10px 20px; border: none; border-radius: 4px 4px 0 0; cursor: pointer;' + (roguelikeTab === 'stats' ? 'background: #f4a460; color: #000;' : 'background: #333; color: #aaa;')">Stats</button>
          </div>
          
          <!-- Upgrades Tab -->
          <div v-if="roguelikeTab === 'upgrades'" style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px;">
            <h3 style="color: #f4a460; margin-bottom: 8px;">Upgrade Tree</h3>
            <p style="color: #aaa; margin-bottom: 20px;">You earn <strong>1 upgrade point</strong> per level. Spend points to unlock nodes below. You have <strong style="color: #7d7;">{{ roguelikeAvailablePoints }}</strong> point(s) available.</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
              <div v-for="tile in roguelikeUpgradeTiles" :key="tile.id" :style="upgradeTileStyle(tile)">
                <div style="font-weight: bold; margin-bottom: 5px; display: flex; justify-content: space-between; gap: 8px;">
                  <span>{{ tile.name }}</span>
                  <span v-if="tile.levels.length > 1" style="color: #aaa; font-size: 13px; white-space: nowrap;">
                    Level {{ upgradeTileLevel(tile) }} / {{ tile.levels.length }}
                  </span>
                </div>
                <div v-if="upgradeTileCurrentBonus(tile)" style="color: #7d7; font-size: 14px; margin-bottom: 6px;">
                  Current: {{ upgradeTileCurrentBonus(tile) }}
                </div>
                <div v-if="upgradeTileNextNode(tile)" style="color: #aaa; font-size: 14px; margin-bottom: 10px;">
                  Next: {{ upgradeTileNextNode(tile).description }}
                </div>
                <div v-else-if="upgradeTileLevel(tile) === 0" style="color: #aaa; font-size: 14px; margin-bottom: 10px;">
                  {{ tile.levels[0].description }}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span v-if="upgradeTileNextNode(tile)" style="color: #f4a460;">{{ upgradeTileNextNode(tile).cost }} pt{{ upgradeTileNextNode(tile).cost === 1 ? '' : 's' }}</span>
                  <span v-else style="color: #666;">—</span>
                  <button v-if="roguelikeCanUpgradeTile(tile)" @click="unlockRoguelikeNode(upgradeTileNextNode(tile).id)" style="padding: 5px 15px; background: #f4a460; color: #000; border: none; border-radius: 4px; cursor: pointer;">{{ upgradeTileLevel(tile) > 0 ? 'Upgrade' : 'Unlock' }}</button>
                  <span v-else-if="isUpgradeTileMaxed(tile)" style="color: #4a4;">Maxed</span>
                  <span v-else style="color: #666;">Locked</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Cards Tab -->
          <div v-if="roguelikeTab === 'cards'" style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px;">
            <h3 style="color: #f4a460; margin-bottom: 12px;">Card Progress &amp; Upgrades</h3>
            <p style="color: #aaa; margin-bottom: 16px;">Each card levels up by being played. Every level grants <strong>1 upgrade point</strong> to spend on that card's upgrades below (some cost more than 1 point).</p>

            <!-- Ban management -->
            <div v-if="banSlots > 0 || selfBannedCards.length > 0" style="margin-bottom: 20px; padding: 14px; background: rgba(255,255,255,0.05); border-radius: 6px;">
              <!-- Permanently banned via each card's own "Ban Card" upgrade -->
              <div v-if="selfBannedCards.length > 0" style="margin-bottom: 14px;">
                <div style="color: #f4a460; font-weight: bold;">Permanently Banned ({{ selfBannedCards.length }})</div>
                <p style="color: #888; font-size: 12px; margin: 4px 0 8px;">Banned via each card's own "Ban Card" upgrade. These do not use a wildcard slot and stay banned until ascension.</p>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                  <span v-for="name in selfBannedCards" :key="name" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(200,60,60,0.25); border: 1px solid #a44; border-radius: 14px; font-size: 12px;">
                    ⛔ {{ name }}
                  </span>
                </div>
              </div>

              <!-- Wildcard ban slots: ban any card -->
              <div v-if="banSlots > 0">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                  <div style="color: #f4a460; font-weight: bold;">Wildcard Ban Slots ({{ wildcardBannedCards.length }}/{{ banSlots }})</div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="color: #aaa; font-size: 13px;">Ban any card:</label>
                    <input
                      list="rogue-ban-card-list"
                      v-model="banDropdownSelection"
                      @keyup.enter="banCardFromInput"
                      :disabled="wildcardBannedCards.length >= banSlots"
                      :placeholder="wildcardBannedCards.length >= banSlots ? 'All slots used' : 'Type to search cards…'"
                      style="padding: 6px 10px; background: #222; color: white; border: 1px solid #555; border-radius: 4px; min-width: 220px;"/>
                    <datalist id="rogue-ban-card-list">
                      <option v-for="name in bannableCardOptions" :key="name" :value="name"></option>
                    </datalist>
                    <button
                      @click="banCardFromInput"
                      :disabled="wildcardBannedCards.length >= banSlots || !banDropdownSelection"
                      :style="'padding: 6px 14px; border: none; border-radius: 4px; font-weight: bold; ' + (wildcardBannedCards.length >= banSlots || !banDropdownSelection ? 'background: #444; color: #777; cursor: not-allowed;' : 'background: #f4a460; color: #000; cursor: pointer;')">Ban</button>
                  </div>
                </div>
                <div v-if="wildcardBannedCards.length > 0" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;">
                  <span v-for="name in wildcardBannedCards" :key="name" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(200,60,60,0.25); border: 1px solid #a44; border-radius: 14px; font-size: 12px;">
                    {{ name }}
                    <button @click="unbanCard(name)" :title="'Unban ' + name" style="background: none; border: none; color: #f88; cursor: pointer; font-size: 14px; line-height: 1; padding: 0;">×</button>
                  </span>
                </div>
                <p v-else style="color: #666; font-size: 12px; margin-top: 10px;">No wildcard bans. Use a slot to ban any card from your runs, or buy a card's "Ban Card" upgrade below to ban it permanently without a slot.</p>
              </div>
            </div>

            <template v-if="(roguelikeSelectedProfile.cardProgress || []).length > 0">
              <!-- Search -->
              <div style="margin-bottom: 14px;">
                <input
                  v-model="cardSearch"
                  placeholder="Search cards…"
                  style="padding: 8px 12px; width: 100%; max-width: 360px; background: #222; color: white; border: 1px solid #555; border-radius: 4px;"/>
              </div>

              <!-- Active cards (cards with upgrade points available float to the top) -->
              <div v-if="activeCardProgress.length > 0" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; align-items: start;">
                <div v-for="entry in activeCardProgress" :key="entry.cardName" :style="'display: flex; flex-direction: column; gap: 10px; padding: 14px; background: rgba(255,255,255,0.05); border-radius: 6px; border-left: 4px solid ' + (cardAvailablePoints(entry.progress) > 0 ? '#7d7' : (entry.progress.mastered ? '#f4a460' : '#4a4')) + ';'">
                  <!-- Card art -->
                  <div style="align-self: center;">
                    <Card :card="cardArt(entry.cardName)" />
                  </div>

                  <!-- Details / upgrades (below the card) -->
                  <div style="min-width: 0;">
                    <div style="color: #aaa; font-size: 12px;">
                      Level {{ cardLevel(entry.progress) }} | Played {{ entry.progress.timesPlayed }}x
                      <span v-if="cardPlaysToNext(entry.progress) !== null"> | {{ cardPlaysToNext(entry.progress) }} play(s) to next level</span>
                      <span v-else> | MAX LEVEL</span>
                      <span v-if="entry.progress.mastered" style="color: #f4a460; font-size: 11px; margin-left: 6px;">★ MASTERED</span>
                    </div>
                    <div :style="'font-size: 13px; margin: 6px 0; font-weight: bold; color: ' + (cardAvailablePoints(entry.progress) > 0 ? '#7d7' : '#666') + ';'">
                      {{ cardAvailablePoints(entry.progress) }} upgrade point(s) available
                    </div>

                    <!-- Upgrade pool -->
                    <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px;">
                      <div v-for="def in cardUpgradeDefs" :key="def.id" style="display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px;">
                        <div>
                          <span :style="cardUpgradeRanks(entry.progress, def.id) > 0 ? 'color:#7d7;' : 'color:#ccc;'">{{ def.name }}</span>
                          <span style="color: #888;"> ({{ cardUpgradeRanks(entry.progress, def.id) }}/{{ def.maxRank }})</span>
                          <span style="color: #666;"> · {{ def.pointCost }}pt</span>
                          <span style="color: #666;" :title="def.description"> · {{ def.description }}</span>
                        </div>
                        <button
                          :disabled="!cardCanBuy(entry.progress, def)"
                          @click="buyCardUpgrade(entry.cardName, def.id)"
                          :style="'flex-shrink: 0; padding: 3px 10px; border: none; border-radius: 3px; font-size: 11px; ' + (cardCanBuy(entry.progress, def) ? 'background: #f4a460; color: #000; cursor: pointer;' : 'background: #444; color: #777; cursor: not-allowed;')">
                          {{ cardUpgradeRanks(entry.progress, def.id) >= def.maxRank ? 'Maxed' : 'Buy' }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p v-else style="color: #666; margin-top: 12px;">No matching cards.</p>

              <!-- Banned cards (collapsed at the bottom) -->
              <details v-if="bannedCardProgress.length > 0" style="margin-top: 24px;">
                <summary style="cursor: pointer; color: #f88; font-weight: bold; padding: 8px 0; user-select: none;">⛔ Banned cards ({{ bannedCardProgress.length }})</summary>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; margin-top: 12px; align-items: start;">
                  <div v-for="entry in bannedCardProgress" :key="entry.cardName" style="display: flex; flex-direction: column; gap: 10px; padding: 14px; background: rgba(255,255,255,0.05); border-radius: 6px; border-left: 4px solid #a44; opacity: 0.85;">
                    <!-- Card art -->
                    <div style="align-self: center;">
                      <Card :card="cardArt(entry.cardName)" />
                    </div>

                    <!-- Details / upgrades (below the card) -->
                    <div style="min-width: 0;">
                      <div style="color: #aaa; font-size: 12px;">
                        Level {{ cardLevel(entry.progress) }} | Played {{ entry.progress.timesPlayed }}x
                        <span v-if="cardPlaysToNext(entry.progress) !== null"> | {{ cardPlaysToNext(entry.progress) }} play(s) to next level</span>
                        <span v-else> | MAX LEVEL</span>
                        <span v-if="entry.progress.mastered" style="color: #f4a460; font-size: 11px; margin-left: 6px;">★ MASTERED</span>
                      </div>
                      <div style="color: #f88; font-size: 12px; margin-top: 2px;">
                        {{ entry.progress.canBan ? '⛔ Permanently banned (Ban Card upgrade)' : '⛔ Banned (wildcard slot)' }}
                      </div>
                      <div :style="'font-size: 13px; margin: 6px 0; font-weight: bold; color: ' + (cardAvailablePoints(entry.progress) > 0 ? '#7d7' : '#666') + ';'">
                        {{ cardAvailablePoints(entry.progress) }} upgrade point(s) available
                      </div>

                      <!-- Upgrade pool -->
                      <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px;">
                        <div v-for="def in cardUpgradeDefs" :key="def.id" style="display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px;">
                          <div>
                            <span :style="cardUpgradeRanks(entry.progress, def.id) > 0 ? 'color:#7d7;' : 'color:#ccc;'">{{ def.name }}</span>
                            <span style="color: #888;"> ({{ cardUpgradeRanks(entry.progress, def.id) }}/{{ def.maxRank }})</span>
                            <span style="color: #666;"> · {{ def.pointCost }}pt</span>
                            <span style="color: #666;" :title="def.description"> · {{ def.description }}</span>
                          </div>
                          <button
                            :disabled="!cardCanBuy(entry.progress, def)"
                            @click="buyCardUpgrade(entry.cardName, def.id)"
                            :style="'flex-shrink: 0; padding: 3px 10px; border: none; border-radius: 3px; font-size: 11px; ' + (cardCanBuy(entry.progress, def) ? 'background: #f4a460; color: #000; cursor: pointer;' : 'background: #444; color: #777; cursor: not-allowed;')">
                            {{ cardUpgradeRanks(entry.progress, def.id) >= def.maxRank ? 'Maxed' : 'Buy' }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            </template>
            <p v-else style="color: #666; margin-top: 20px;">No card progress yet. Play some games!</p>
          </div>
          
          <!-- Ascension Tab -->
          <div v-if="roguelikeTab === 'ascension'" style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px;">
            <h3 style="color: #f4a460; margin-bottom: 8px;">Ascension Tree</h3>

            <!-- Locked state: never unlocked ascension -->
            <div v-if="!roguelikeAscensionTreeAvailable()" style="padding: 20px; background: rgba(0,0,0,0.3); border: 2px dashed #555; border-radius: 8px; color: #aaa;">
              🔒 Ascension is locked. Buy the <strong style="color: #f4a460;">Ascension Protocol</strong> node in the Upgrades tab to unlock this tree.
            </div>

            <!-- Available: ascension tree (spendable even when Ascension Protocol is reset) -->
            <div v-else>
              <p style="color: #aaa; margin-bottom: 8px;">
                Ascension points are earned by <strong style="color: #c9f;">ascending</strong>. Ascending converts the XP
                you've accumulated this cycle into permanent points and resets the rest of your profile (XP, upgrade tree,
                banned cards and per-card progress). Your ascension tree and lifetime stats are kept.
                Spend points on permanent buffs and difficulty modifiers (difficulty nodes increase your XP multiplier).
              </p>
              <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 16px; flex-wrap: wrap;">
                <div style="color: #c9f; font-weight: bold;">{{ roguelikeAvailableAscensionPoints }} ascension point(s) available</div>
                <div style="color: #aaa; font-size: 13px;">Ascensions: {{ roguelikeSelectedProfile.ascensionCount || 0 }}</div>
                <div style="color: #8cf;">Current run XP multiplier: x{{ roguelikeAscensionXPMultiplier().toFixed(1) }}</div>
              </div>

              <!-- Ascend action -->
              <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding: 14px 16px; background: rgba(140,200,255,0.08); border: 1px solid #c9f; border-radius: 8px; flex-wrap: wrap;">
                <button @click="ascendRoguelike" :disabled="!roguelikeCanAscend()" :style="'padding: 10px 22px; border: none; border-radius: 4px; font-weight: bold; ' + (roguelikeCanAscend() ? 'background: #c9f; color: #000; cursor: pointer;' : 'background: #444; color: #888; cursor: not-allowed;')">Ascend</button>
                <div v-if="!roguelikeAscensionUnlocked()" style="color: #f4a460; font-size: 13px;">
                  🔒 Buy the <strong>Ascension Protocol</strong> upgrade again (Upgrades tab) to ascend.
                </div>
                <div v-else-if="roguelikePendingAscensionPoints() >= 1" style="color: #c9f;">
                  Ascending now grants <strong>{{ roguelikePendingAscensionPoints() }}</strong> ascension point(s).
                </div>
                <div v-else style="color: #aaa; font-size: 13px;">
                  {{ roguelikeAscensionProgress().xpIntoCurrent }} / {{ roguelikeAscensionProgress().xpForNext }} XP until your first ascension point this cycle.
                </div>
              </div>

              <AscensionTreeView
                :unlocked-nodes="roguelikeAscensionUnlockedNodes"
                :available-points="roguelikeAvailableAscensionPoints"
                @unlock="unlockRoguelikeAscensionNode"
              />
            </div>
          </div>
          
          <!-- Stats Tab -->
          <div v-if="roguelikeTab === 'stats'" style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px;">
            <div style="display: flex; gap: 24px; margin-bottom: 18px; flex-wrap: wrap;">
              <div><span style="color: #aaa;">Ascensions:</span> <strong style="color: #c9f;">{{ roguelikeSelectedProfile.ascensionCount || 0 }}</strong></div>
              <div><span style="color: #aaa;">Ascension Points:</span> <strong style="color: #c9f;">{{ roguelikeSelectedProfile.ascensionPoints || 0 }}</strong> earned ({{ roguelikeAvailableAscensionPoints }} available)</div>
            </div>

            <h3 style="color: #c9f; margin-bottom: 14px;">Current Ascension Stats</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 28px;">
              <div><span style="color: #aaa;">Runs:</span> {{ roguelikeSelectedProfile.ascensionStats?.totalRuns || 0 }}</div>
              <div><span style="color: #aaa;">Wins:</span> {{ roguelikeSelectedProfile.ascensionStats?.totalWins || 0 }}</div>
              <div><span style="color: #aaa;">Losses:</span> {{ roguelikeSelectedProfile.ascensionStats?.totalLosses || 0 }}</div>
              <div><span style="color: #aaa;">Win Streak:</span> {{ roguelikeSelectedProfile.ascensionStats?.currentWinStreak || 0 }} (best {{ roguelikeSelectedProfile.ascensionStats?.longestWinStreak || 0 }})</div>
              <div><span style="color: #aaa;">Current XP:</span> {{ roguelikeSelectedProfile.totalXP || 0 }}</div>
              <div><span style="color: #aaa;">Cards Played:</span> {{ roguelikeSelectedProfile.ascensionStats?.totalCardsPlayed || 0 }}</div>
              <div><span style="color: #aaa;">Tiles Placed:</span> {{ roguelikeSelectedProfile.ascensionStats?.totalTilesPlaced || 0 }}</div>
              <div><span style="color: #aaa;">Total VP:</span> {{ roguelikeSelectedProfile.ascensionStats?.totalVP || 0 }}</div>
              <div><span style="color: #aaa;">Highest VP:</span> {{ roguelikeSelectedProfile.ascensionStats?.highestVP || 0 }}</div>
            </div>

            <h3 style="color: #f4a460; margin-bottom: 14px;">Full Game Stats (Lifetime)</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <div><span style="color: #aaa;">Total Runs:</span> {{ roguelikeSelectedProfile.stats?.totalRuns || 0 }}</div>
              <div><span style="color: #aaa;">Wins:</span> {{ roguelikeSelectedProfile.stats?.totalWins || 0 }}</div>
              <div><span style="color: #aaa;">Losses:</span> {{ roguelikeSelectedProfile.stats?.totalLosses || 0 }}</div>
              <div><span style="color: #aaa;">Win Streak:</span> {{ roguelikeSelectedProfile.stats?.currentWinStreak || 0 }} (best {{ roguelikeSelectedProfile.stats?.longestWinStreak || 0 }})</div>
              <div><span style="color: #aaa;">Cards Played:</span> {{ roguelikeSelectedProfile.stats?.totalCardsPlayed || 0 }}</div>
              <div><span style="color: #aaa;">Tiles Placed:</span> {{ roguelikeSelectedProfile.stats?.totalTilesPlaced || 0 }}</div>
              <div><span style="color: #aaa;">Total VP:</span> {{ roguelikeSelectedProfile.stats?.totalVP || 0 }}</div>
              <div><span style="color: #aaa;">Highest VP:</span> {{ roguelikeSelectedProfile.stats?.highestVP || 0 }}</div>
            </div>
          </div>
          
          <!-- Start Game -->
          <div style="margin-top: 30px; padding: 20px; background: rgba(244,164,96,0.1); border: 2px solid #f4a460; border-radius: 8px;">
            <h3 style="color: #f4a460; margin-bottom: 15px;">Start New Run</h3>
            <div style="color: #aaa; margin-bottom: 15px;">
              {{ roguelikeAscensionUnlockedNodes.size }} ascension node(s) | 
              {{ roguelikeUnlockedNodes.size }} upgrades unlocked
            </div>

            <div v-if="roguelikeSettings" style="margin-bottom: 18px;">
              <div style="margin-bottom: 12px; padding: 10px 14px; background: rgba(140,200,255,0.12); border: 1px solid #8cf; border-radius: 6px; font-size: 16px;">
                Game Length: <strong style="color: #8cf;">{{ roguelikeSettings.totalGenerations }} generations</strong>
                <span v-if="roguelikeSettings.generationPenalty < 0" style="color: #e88; font-size: 13px;"> ({{ roguelikeSettings.generationPenalty }} from ascension)</span>
              </div>
              <div style="color: #f4a460; font-weight: bold; margin-bottom: 8px;">Starting Bonuses This Run</div>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px;">
                <div :style="rogueBonusStyle(roguelikeSettings.netTRBonus)">
                  Starting TR: {{ roguelikeTotalStartingTR }}
                </div>
                <div :style="rogueBonusStyle(roguelikeSettings.netMCBonus)">
                  Starting M€: {{ formatDelta(roguelikeSettings.netMCBonus) }}
                </div>
                <div v-if="roguelikeSettings.upgradeBonuses.startingSteelBonus > 0" :style="rogueBonusStyle(roguelikeSettings.upgradeBonuses.startingSteelBonus)">
                  Steel: +{{ roguelikeSettings.upgradeBonuses.startingSteelBonus }}
                </div>
                <div v-if="roguelikeSettings.upgradeBonuses.startingTitaniumBonus > 0" :style="rogueBonusStyle(roguelikeSettings.upgradeBonuses.startingTitaniumBonus)">
                  Titanium: +{{ roguelikeSettings.upgradeBonuses.startingTitaniumBonus }}
                </div>
                <div :style="rogueBonusStyle(roguelikeSettings.netCardDrawBonus)">
                  Starting Cards: {{ roguelikeTotalStartingCards }}
                </div>
                <div v-if="roguelikeSettings.corporationChoices > 2" :style="rogueBonusStyle(roguelikeSettings.corporationChoices - 2)">
                  Corporations: {{ roguelikeSettings.corporationChoices }}
                </div>
                <div v-if="roguelikeSettings.preludeSlots > 0" :style="rogueBonusStyle(roguelikeSettings.preludeSlots)">
                  Preludes: {{ roguelikeSettings.preludeSlots }}
                </div>
                <div v-if="roguelikeSettings.cardCostIncrease > 0" :style="rogueBonusStyle(-roguelikeSettings.cardCostIncrease)">
                  Card Cost: +{{ roguelikeSettings.cardCostIncrease }}M€
                </div>
                <div v-if="roguelikeSettings.generationPenalty < 0" :style="rogueBonusStyle(roguelikeSettings.generationPenalty)">
                  Generations: {{ roguelikeSettings.generationPenalty }}
                </div>
                <div v-if="roguelikeMasteredCount > 0" :style="rogueBonusStyle(1)">
                  Mastered (guaranteed): {{ roguelikeMasteredCount }}
                </div>
              </div>
              <div v-if="roguelikeSettings.ascension && roguelikeSettings.ascension.xpMultiplier > 1" style="color: #8cf; font-size: 13px; margin-top: 8px;">
                XP Multiplier: x{{ roguelikeSettings.ascension.xpMultiplier.toFixed(1) }}
              </div>
              <div v-if="roguelikeSettings.cardProgressMultiplier > 1" style="color: #8cf; font-size: 13px; margin-top: 8px;">
                Card Progress: x{{ roguelikeSettings.cardProgressMultiplier.toFixed(2) }}
              </div>
            </div>

            <button @click="startRoguelikeRun" style="padding: 15px 40px; background: #f4a460; color: #000; border: none; border-radius: 4px; font-weight: bold; font-size: 18px; cursor: pointer;">Start Roguelike Run</button>
          </div>
        </div>
      </div>
    </div>
    <div class="notice" v-i18n>
      Not affiliated with FryxGames, Asmodee Digital or Steam in any way.
    </div>
  </div>
</template>

<script lang="ts">
import {defineAsyncComponent, defineComponent} from 'vue';
import * as constants from '@/common/constants';

const AdminHome = defineAsyncComponent(() => import(/* webpackChunkName: "admin" */ '@/client/components/admin/AdminHome.vue'));
const CardList = defineAsyncComponent(() => import(/* webpackChunkName: "card-list" */ '@/client/components/cardlist/CardList.vue'));
const CreateGameForm = defineAsyncComponent(() => import(/* webpackChunkName: "create-game" */ '@/client/components/create/CreateGameForm.vue'));
const GameEnd = defineAsyncComponent(() => import(/* webpackChunkName: "game-end" */ '@/client/components/GameEnd.vue'));
const GameHome = defineAsyncComponent(() => import(/* webpackChunkName: "game-home" */ '@/client/components/GameHome.vue'));
const GamesOverview = defineAsyncComponent(() => import(/* webpackChunkName: "games-overview" */ '@/client/components/GamesOverview.vue'));
const Help = defineAsyncComponent(() => import(/* webpackChunkName: "help" */ '@/client/components/help/Help.vue'));
const LoginHome = defineAsyncComponent(() => import(/* webpackChunkName: "login" */ '@/client/components/auth/LoginHome.vue'));
const LoadGameForm = defineAsyncComponent(() => import(/* webpackChunkName: "load-game" */ '@/client/components/LoadGameForm.vue'));
const PlayerHome = defineAsyncComponent(() => import(/* webpackChunkName: "player-home" */ '@/client/components/PlayerHome.vue'));
import Card from '@/client/components/card/Card.vue';
const SpectatorHome = defineAsyncComponent(() => import(/* webpackChunkName: "spectator-home" */ '@/client/components/SpectatorHome.vue'));
const StartScreen = defineAsyncComponent(() => import(/* webpackChunkName: "start-screen" */ '@/client/components/StartScreen.vue'));
import {$t, setTranslationContext} from '@/client/directives/i18n';
import {paths} from '@/common/app/paths';
import {ROGUELIKE_BASE_TR, ROGUELIKE_BASE_STARTING_CARDS} from '@/common/roguelike/constants';
import {getUpgradeNode} from '@/common/roguelike/UpgradeNode';
import {
  getUpgradeDisplayTiles,
  getTileUnlockedLevel,
  getTileNextLevel,
  getTileCurrentBonusText,
  canUnlockTileNextLevel,
  isTileMaxed,
  UpgradeDisplayTile,
} from '@/common/roguelike/UpgradeTreeDisplay';
import {getLevel, getLevelProgress, getTotalUpgradePoints} from '@/common/roguelike/Leveling';
import {computeAscensionEffects, getAscensionNode} from '@/common/roguelike/AscensionTree';
import AscensionTreeView from '@/client/components/roguelike/AscensionTreeView.vue';
import {getEarnedAscensionPoints, getAscensionPointProgress} from '@/common/roguelike/AscensionPoints';
import {CARD_UPGRADES, getAvailablePoints, canPurchaseCardUpgrade} from '@/common/roguelike/CardUpgrade';
import {calculateCardLevel, playsToNextLevel} from '@/common/roguelike/CardProgress';
import {CardName} from '@/common/cards/CardName';
import {getCards, byType} from '@/client/cards/ClientCardManifest';
import {CardType} from '@/common/cards/CardType';
import {GameModule} from '@/common/cards/GameModule';
import {toName} from '@/common/utils/utils';
import {PlayerViewModel, ViewModel} from '@/common/models/PlayerModel';
import {SimpleGameModel} from '@/common/models/SimpleGameModel';
import {SpectatorModel} from '@/common/models/SpectatorModel';
import {isPlayerId, isSpectatorId} from '@/common/Types';
import {hasShowModal, showModal, windowHasHTMLDialogElement} from './HTMLDialogElementCompatibility';

import dialogPolyfill from 'dialog-polyfill';
import {setDocumentTitle} from '../utils/documentTitle';

// Modules used by roguelike runs (base + Corporate Era). Wildcard bans can
// target any project card from these expansions.
const ROGUELIKE_BANNABLE_MODULES = new Set<GameModule>(['base', 'corpera']);
const ROGUELIKE_BANNABLE_CARDS: ReadonlyArray<string> = [
  ...getCards(byType(CardType.AUTOMATED)),
  ...getCards(byType(CardType.ACTIVE)),
  ...getCards(byType(CardType.EVENT)),
]
  .filter((card) => ROGUELIKE_BANNABLE_MODULES.has(card.module))
  .map(toName)
  .sort((a, b) => a.localeCompare(b));

type Screen = 'admin' |
            'create-game-form' |
            'cards' |
            'empty' |
            'game-home' |
            'games-overview' |
            'help' |
            'load' |
            'login-home' |
            'player-home' |
            'roguelike' |
            'spectator-home' |
            'start-screen' |
            'the-end';
const ROGUELIKE_UPGRADE_TILES = getUpgradeDisplayTiles();

type MainAppData = {
    screen: Screen;
    /**
     * player or spectator are set once the app component has loaded.
     * Vue only watches properties that exist initially. When we
     * use this property we can't trigger vue state without
     * a refactor.
     */
    spectator?: SpectatorModel;
    playerView?: PlayerViewModel;
    // playerKey might seem to serve no function, but it's basically an arbitrary value used
    // to force a rerender / refresh.
    // See https://michaelnthiessen.com/force-re-render/
    playerkey: number;
    isServerSideRequestInProgress: boolean;
    componentsVisibility: {[x: string]: boolean};
    game: SimpleGameModel | undefined;
    login: string | undefined;
    roguelikeProfiles: Array<any>;
    roguelikeNewName: string;
    roguelikeSelectedProfile: any;
    roguelikeTab: string;
    roguelikeUpgradeTiles: ReadonlyArray<UpgradeDisplayTile>;
    roguelikeUnlockedNodes: Set<string>;
    roguelikeAvailablePoints: number;
    roguelikeAscensionUnlockedNodes: Set<string>;
    roguelikeAvailableAscensionPoints: number;
    roguelikeSettings: any;
    banDropdownSelection: string;
    cardSearch: string;
}

// NOTE: this simplistic truncation to the last segment might cause issues if
// this page starts supporting paths more than one level deep.
function getLastPathSegment() {
  // Leave only the last part of /path
  return window.location.pathname.replace(/.*\//g, '');
}

export default defineComponent({
  name: 'App',
  data(): MainAppData {
    return {
      screen: 'empty',
      playerkey: 0,
      isServerSideRequestInProgress: false,
      componentsVisibility: {
        'milestones': true,
        'awards_list': true,
        'tags_concise': false,
        'pinned_player_0': false,
        'pinned_player_1': false,
        'pinned_player_2': false,
        'pinned_player_3': false,
        'pinned_player_4': false,
        'turmoil_parties': false,
      } as {[x: string]: boolean},
      game: undefined as SimpleGameModel | undefined,
      playerView: undefined,
      spectator: undefined,
      login: undefined,
      roguelikeProfiles: [],
      roguelikeNewName: '',
      roguelikeSelectedProfile: null,
      roguelikeTab: 'upgrades',
      roguelikeUpgradeTiles: ROGUELIKE_UPGRADE_TILES,
      roguelikeUnlockedNodes: new Set<string>(),
      roguelikeAvailablePoints: 0,
      roguelikeAscensionUnlockedNodes: new Set<string>(),
      roguelikeAvailableAscensionPoints: 0,
      roguelikeSettings: null,
      banDropdownSelection: '',
      cardSearch: '',
    };
  },
  components: {
    StartScreen,
    CreateGameForm,
    LoadGameForm,
    GameHome,
    PlayerHome,
    SpectatorHome,
    GameEnd,
    GamesOverview,
    CardList,
    Help,
    AdminHome,
    LoginHome,
    Card,
    AscensionTreeView,
  },
  computed: {
    activeCardProgress(): Array<{cardName: string; progress: any}> {
      const app = this as unknown as MainAppData;
      const profile = app.roguelikeSelectedProfile;
      if (!profile || !Array.isArray(profile.cardProgress)) {
        return [];
      }
      const wildcard = new Set<string>(profile.upgradeTree?.bannedCards || []);
      const search = (app.cardSearch || '').trim().toLowerCase();
      return profile.cardProgress
        .filter((cp: any) => !(wildcard.has(cp.cardName) || cp.progress?.canBan === true))
        .filter((cp: any) => search === '' || cp.cardName.toLowerCase().includes(search))
        .sort((a: any, b: any) => {
          // Cards with upgrade points to spend always float to the top.
          const ap = getAvailablePoints(a.progress);
          const bp = getAvailablePoints(b.progress);
          if (bp !== ap) {
            return bp - ap;
          }
          return (b.progress.timesPlayed || 0) - (a.progress.timesPlayed || 0);
        });
    },
    bannedCardProgress(): Array<{cardName: string; progress: any}> {
      const app = this as unknown as MainAppData;
      const profile = app.roguelikeSelectedProfile;
      if (!profile || !Array.isArray(profile.cardProgress)) {
        return [];
      }
      const wildcard = new Set<string>(profile.upgradeTree?.bannedCards || []);
      const search = (app.cardSearch || '').trim().toLowerCase();
      return profile.cardProgress
        .filter((cp: any) => wildcard.has(cp.cardName) || cp.progress?.canBan === true)
        .filter((cp: any) => search === '' || cp.cardName.toLowerCase().includes(search))
        .sort((a: any, b: any) => (b.progress.timesPlayed || 0) - (a.progress.timesPlayed || 0));
    },
    roguelikeMasteredCount(): number {
      const app = this as unknown as MainAppData;
      const profile = app.roguelikeSelectedProfile;
      if (!profile || !Array.isArray(profile.cardProgress)) {
        return 0;
      }
      return profile.cardProgress.filter((cp: any) => cp.progress?.mastered).length;
    },
    roguelikeTotalStartingTR(): number {
      const app = this as unknown as MainAppData;
      const settings = app.roguelikeSettings;
      if (!settings) {
        return ROGUELIKE_BASE_TR;
      }
      const baseTR = settings.baseTR ?? ROGUELIKE_BASE_TR;
      return baseTR + (settings.netTRBonus ?? 0);
    },
    roguelikeTotalStartingCards(): number {
      const app = this as unknown as MainAppData;
      const settings = app.roguelikeSettings;
      if (!settings) {
        return ROGUELIKE_BASE_STARTING_CARDS;
      }
      const baseStartingCards = settings.baseStartingCards ?? ROGUELIKE_BASE_STARTING_CARDS;
      return baseStartingCards + (settings.netCardDrawBonus ?? 0);
    },
    cardUpgradeDefs(): ReadonlyArray<any> {
      return CARD_UPGRADES;
    },
    banSlots(): number {
      const app = this as unknown as MainAppData;
      let slots = 0;
      for (const id of ['ban_slots_1', 'ban_slots_2', 'ban_slots_3']) {
        if (app.roguelikeUnlockedNodes.has(id)) {
          slots++;
        }
      }
      return slots;
    },
    wildcardBannedCards(): Array<string> {
      const app = this as unknown as MainAppData;
      return app.roguelikeSelectedProfile?.upgradeTree?.bannedCards || [];
    },
    selfBannedCards(): Array<string> {
      const app = this as unknown as MainAppData;
      const profile = app.roguelikeSelectedProfile;
      if (!profile || !Array.isArray(profile.cardProgress)) {
        return [];
      }
      return profile.cardProgress
        .filter((cp: any) => cp.progress?.canBan)
        .map((cp: any) => cp.cardName)
        .sort((a: string, b: string) => a.localeCompare(b));
    },
    bannableCardOptions(): Array<string> {
      const app = this as unknown as MainAppData;
      const profile = app.roguelikeSelectedProfile;
      const banned = new Set<string>(profile?.upgradeTree?.bannedCards || []);
      for (const cp of profile?.cardProgress || []) {
        if (cp.progress?.canBan) {
          banned.add(cp.cardName);
        }
      }
      return ROGUELIKE_BANNABLE_CARDS.filter((name) => !banned.has(name));
    },
  },
  methods: {
    showAlert(title: string, message: string, cb: () => void = () => {}): void {
      const dialogElement: HTMLElement | null = document.getElementById('alert-dialog');
      const buttonElement: HTMLElement | null = document.getElementById('alert-dialog-button');
      const messageElement: HTMLElement | null = document.getElementById('alert-dialog-message');
      const titleElement: HTMLElement | null = document.getElementById('alert-dialog-title');
      if (buttonElement !== null && titleElement !== null && messageElement !== null && dialogElement !== null && hasShowModal(dialogElement)) {
        messageElement.innerHTML = $t(message);
        titleElement.textContent = $t(title);
        const handler = () => {
          buttonElement.removeEventListener('click', handler);
          cb();
        };
        buttonElement.addEventListener('click', handler);
        showModal(dialogElement);
      } else {
        alert(message);
        cb();
      }
    },
    setVisibilityState(targetVar: string, isVisible: boolean) {
      if (isVisible === this.getVisibilityState(targetVar)) {
        return;
      }
      (this as unknown as MainAppData).componentsVisibility[targetVar] = isVisible;
    },
    getVisibilityState(targetVar: string): boolean {
      return (this as unknown as MainAppData).componentsVisibility[targetVar] ? true : false;
    },
    update(path: typeof paths.PLAYER | typeof paths.SPECTATOR): void {
      const currentPathname = getLastPathSegment();
      const app = this as unknown as MainAppData;

      const url = 'api/' + path + window.location.search.replace('&noredirect', '');

      fetch(url)
        .then((resp) => {
          if (!resp.ok) {
            throw new Error(`Error getting game data: ${resp.statusText}`);
          }
          return resp.json();
        })
        .then((model: ViewModel) => {
          if (path === paths.PLAYER) {
            app.playerView = model as PlayerViewModel;
            setTranslationContext(app.playerView);
          } else if (path === paths.SPECTATOR) {
            app.spectator = model as SpectatorModel;
          }
          app.playerkey++;
          if (
            model.game.phase === 'end' &&
              window.location.search.includes('&noredirect') === false
          ) {
            app.screen = 'the-end';
            if (currentPathname !== paths.THE_END) {
              window.history.replaceState(
                model,
                `${constants.APP_NAME} - Player`,
                `${paths.THE_END}?id=${model.id}`,
              );
            }
          } else {
            if (path === paths.PLAYER) {
              app.screen = 'player-home';
            } else if (path === paths.SPECTATOR) {
              app.screen = 'spectator-home';
            }
            if (currentPathname !== path) {
              window.history.replaceState(
                model,
                `${constants.APP_NAME} - Game`,
                `${path}?id=${model.id}`,
              );
            }
          }
        })
        .catch((err) => {
          alert('Error getting game data');
          console.error(err);
        });
    },
    updatePlayer() {
      this.update(paths.PLAYER);
    },
    updateSpectator() {
      this.update(paths.SPECTATOR);
    },
    async loadRoguelikeProfiles() {
      try {
        const res = await fetch('/api/roguelike/profiles');
        (this as unknown as MainAppData).roguelikeProfiles = await res.json();
      } catch (e) {
        console.error('Failed to load profiles:', e);
      }
    },
    async createRoguelikeProfile() {
      const app = this as unknown as MainAppData;
      if (!app.roguelikeNewName.trim()) return;
      try {
        const res = await fetch('/api/roguelike/profiles', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({name: app.roguelikeNewName}),
        });
        if (res.ok) {
          const profile = await res.json();
          app.roguelikeProfiles.push(profile);
          app.roguelikeNewName = '';
        }
      } catch (e) {
        console.error('Failed to create profile:', e);
      }
    },
    async deleteRoguelikeProfile(profile: any) {
      const app = this as unknown as MainAppData;
      if (!confirm(`Delete profile "${profile.name}"? This permanently erases all of its progression and cannot be undone.`)) {
        return;
      }
      try {
        const res = await fetch('/api/roguelike/profile?id=' + encodeURIComponent(profile.id) + '&action=delete', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
        });
        if (res.ok) {
          app.roguelikeProfiles = app.roguelikeProfiles.filter((p: any) => p.id !== profile.id);
          if (app.roguelikeSelectedProfile && app.roguelikeSelectedProfile.id === profile.id) {
            app.roguelikeSelectedProfile = null;
          }
        } else {
          console.error('Failed to delete profile:', await res.text());
        }
      } catch (e) {
        console.error('Failed to delete profile:', e);
      }
    },
    async selectRoguelikeProfile(profile: any) {
      const app = this as unknown as MainAppData;
      // The profile list only contains summaries; fetch the full profile.
      try {
        const res = await fetch('/api/roguelike/profile?id=' + encodeURIComponent(profile.id));
        if (res.ok) {
          app.roguelikeSelectedProfile = await res.json();
        } else {
          app.roguelikeSelectedProfile = profile;
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
        app.roguelikeSelectedProfile = profile;
      }
      app.roguelikeUnlockedNodes = new Set(app.roguelikeSelectedProfile.upgradeTree?.unlockedNodes || []);
      app.roguelikeAscensionUnlockedNodes = new Set(app.roguelikeSelectedProfile.ascensionTree?.unlockedNodes || []);
      this.calculateRoguelikeAvailablePoints();
      this.fetchRoguelikeSettings();
    },
    async fetchRoguelikeSettings() {
      const app = this as unknown as MainAppData;
      if (!app.roguelikeSelectedProfile) return;
      try {
        const res = await fetch('/api/roguelike/settings?id=' + encodeURIComponent(app.roguelikeSelectedProfile.id));
        if (res.ok) {
          app.roguelikeSettings = await res.json();
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    },
    calculateRoguelikeAvailablePoints() {
      const app = this as unknown as MainAppData;
      if (!app.roguelikeSelectedProfile) return;
      let spent = 0;
      for (const nodeId of app.roguelikeUnlockedNodes) {
        const node = getUpgradeNode(nodeId);
        if (node) spent += node.cost;
      }
      const totalPoints = getTotalUpgradePoints(app.roguelikeSelectedProfile.totalXP || 0);
      app.roguelikeAvailablePoints = totalPoints - spent;

      let spentAsc = 0;
      for (const nodeId of app.roguelikeAscensionUnlockedNodes) {
        const node = getAscensionNode(nodeId);
        if (node) spentAsc += node.cost;
      }
      // Ascension points are a persisted, earned-by-ascending currency.
      const earnedAsc = app.roguelikeSelectedProfile.ascensionPoints || 0;
      app.roguelikeAvailableAscensionPoints = earnedAsc - spentAsc;
    },
    roguelikePendingAscensionPoints(): number {
      const app = this as unknown as MainAppData;
      return getEarnedAscensionPoints(app.roguelikeSelectedProfile?.totalXP || 0);
    },
    roguelikeCanAscend(): boolean {
      return this.roguelikeAscensionUnlocked() && this.roguelikePendingAscensionPoints() >= 1;
    },
    async ascendRoguelike() {
      const app = this as unknown as MainAppData;
      if (!app.roguelikeSelectedProfile) return;
      const pending = this.roguelikePendingAscensionPoints();
      if (!confirm(
        `Ascend now?\n\nYou will gain ${pending} ascension point(s).\n\n` +
        'This resets your XP, the entire upgrade tree (including Ascension Protocol), ' +
        'banned cards, and all per-card progress. Your ascension tree and lifetime stats are kept.')) {
        return;
      }
      try {
        const res = await fetch('/api/roguelike/ascend', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({profileId: app.roguelikeSelectedProfile.id}),
        });
        if (res.ok) {
          const {profile, pointsEarned} = await res.json();
          app.roguelikeSelectedProfile = profile;
          app.roguelikeUnlockedNodes = new Set(profile.upgradeTree?.unlockedNodes || []);
          app.roguelikeAscensionUnlockedNodes = new Set(profile.ascensionTree?.unlockedNodes || []);
          this.calculateRoguelikeAvailablePoints();
          this.fetchRoguelikeSettings();
          alert(`Ascended! Gained ${pointsEarned} ascension point(s).`);
        } else {
          const err = await res.text();
          alert('Cannot ascend: ' + err);
        }
      } catch (e) {
        console.error('Failed to ascend:', e);
      }
    },
    roguelikeLevel(profile: any): number {
      return getLevel(profile?.totalXP || 0);
    },
    roguelikeLevelProgress() {
      const app = this as unknown as MainAppData;
      return getLevelProgress(app.roguelikeSelectedProfile?.totalXP || 0);
    },
    roguelikeAscensionUnlocked(): boolean {
      const app = this as unknown as MainAppData;
      return app.roguelikeUnlockedNodes.has('ascension_unlock');
    },
    roguelikeAscensionTreeAvailable(): boolean {
      const app = this as unknown as MainAppData;
      const profile = app.roguelikeSelectedProfile;
      return this.roguelikeAscensionUnlocked() ||
        (profile?.ascensionCount || 0) > 0 ||
        (profile?.ascensionPoints || 0) > 0;
    },
    roguelikeAscensionProgress() {
      const app = this as unknown as MainAppData;
      return getAscensionPointProgress(app.roguelikeSelectedProfile?.totalXP || 0);
    },
    roguelikeAscensionXPMultiplier(): number {
      const app = this as unknown as MainAppData;
      return 1 + computeAscensionEffects([...app.roguelikeAscensionUnlockedNodes]).xpMultiplierBonus;
    },
    async unlockRoguelikeAscensionNode(nodeId: string) {
      const app = this as unknown as MainAppData;
      try {
        const res = await fetch('/api/roguelike/ascension', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({profileId: app.roguelikeSelectedProfile.id, nodeId}),
        });
        if (res.ok) {
          const updated = await res.json();
          app.roguelikeSelectedProfile = updated;
          app.roguelikeAscensionUnlockedNodes = new Set(updated.ascensionTree?.unlockedNodes || []);
          this.calculateRoguelikeAvailablePoints();
          this.fetchRoguelikeSettings();
        } else {
          const err = await res.text();
          alert('Cannot unlock: ' + err);
        }
      } catch (e) {
        console.error('Failed to unlock ascension node:', e);
      }
    },
    upgradeTileLevel(tile: UpgradeDisplayTile): number {
      const app = this as unknown as MainAppData;
      return getTileUnlockedLevel(tile, app.roguelikeUnlockedNodes);
    },
    upgradeTileCurrentBonus(tile: UpgradeDisplayTile): string | undefined {
      const app = this as unknown as MainAppData;
      return getTileCurrentBonusText(tile, app.roguelikeUnlockedNodes);
    },
    upgradeTileNextNode(tile: UpgradeDisplayTile) {
      const app = this as unknown as MainAppData;
      return getTileNextLevel(tile, app.roguelikeUnlockedNodes);
    },
    isUpgradeTileMaxed(tile: UpgradeDisplayTile): boolean {
      const app = this as unknown as MainAppData;
      return isTileMaxed(tile, app.roguelikeUnlockedNodes);
    },
    roguelikeCanUpgradeTile(tile: UpgradeDisplayTile): boolean {
      const app = this as unknown as MainAppData;
      return canUnlockTileNextLevel(tile, app.roguelikeUnlockedNodes, app.roguelikeAvailablePoints);
    },
    upgradeTileStyle(tile: UpgradeDisplayTile): string {
      const maxed = this.isUpgradeTileMaxed(tile);
      const canUpgrade = this.roguelikeCanUpgradeTile(tile);
      const level = this.upgradeTileLevel(tile);
      const border = maxed ? '#4a4' : (canUpgrade ? '#f4a460' : (level > 0 ? '#6a6' : '#444'));
      const background = maxed ? 'rgba(68,170,68,0.2)' : (level > 0 ? 'rgba(68,170,68,0.12)' : 'rgba(0,0,0,0.3)');
      return `padding: 15px; border-radius: 8px; border: 2px solid ${border}; background: ${background};`;
    },
    roguelikeCanUnlock(node: any): boolean {
      const app = this as unknown as MainAppData;
      if (app.roguelikeUnlockedNodes.has(node.id)) return false;
      if (node.cost > app.roguelikeAvailablePoints) return false;
      for (const prereq of node.prerequisites) {
        if (!app.roguelikeUnlockedNodes.has(prereq)) return false;
      }
      return true;
    },
    async unlockRoguelikeNode(nodeId: string) {
      const app = this as unknown as MainAppData;
      try {
        const res = await fetch('/api/roguelike/upgrade', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({profileId: app.roguelikeSelectedProfile.id, nodeId}),
        });
        if (res.ok) {
          const updated = await res.json();
          app.roguelikeSelectedProfile = updated;
          app.roguelikeUnlockedNodes = new Set(updated.upgradeTree?.unlockedNodes || []);
          app.roguelikeAscensionUnlockedNodes = new Set(updated.ascensionTree?.unlockedNodes || []);
          this.calculateRoguelikeAvailablePoints();
          this.fetchRoguelikeSettings();
        } else {
          const err = await res.text();
          alert('Cannot unlock: ' + err);
        }
      } catch (e) {
        console.error('Failed to unlock node:', e);
      }
    },
    async startRoguelikeRun() {
      const app = this as unknown as MainAppData;
      if (!app.roguelikeSelectedProfile) return;
      try {
        const res = await fetch('/api/roguelike/start', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({profileId: app.roguelikeSelectedProfile.id}),
        });
        if (res.ok) {
          const {url} = await res.json();
          window.location.href = url;
        } else {
          alert('Failed to start game');
        }
      } catch (e) {
        console.error('Failed to start roguelike run:', e);
        alert('Failed to start game');
      }
    },
    cardArt(cardName: string): {name: CardName} {
      return {name: cardName as CardName};
    },
    cardLevel(progress: any): number {
      return calculateCardLevel(progress.timesPlayed || 0);
    },
    cardPlaysToNext(progress: any): number | null {
      const v = playsToNextLevel(progress.timesPlayed || 0);
      return v === undefined ? null : v;
    },
    cardAvailablePoints(progress: any): number {
      return getAvailablePoints(progress);
    },
    cardUpgradeRanks(progress: any, upgradeId: string): number {
      return (progress.upgrades || {})[upgradeId] || 0;
    },
    cardCanBuy(progress: any, def: any): boolean {
      return canPurchaseCardUpgrade(progress, def.id).ok;
    },
    async buyCardUpgrade(cardName: string, upgradeId: string) {
      const app = this as unknown as MainAppData;
      if (!app.roguelikeSelectedProfile) return;
      try {
        const res = await fetch('/api/roguelike/card-upgrade', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({profileId: app.roguelikeSelectedProfile.id, cardName, upgradeId}),
        });
        if (res.ok) {
          app.roguelikeSelectedProfile = await res.json();
        } else {
          const err = await res.text();
          alert('Cannot buy upgrade: ' + err);
        }
      } catch (e) {
        console.error('Failed to buy card upgrade:', e);
      }
    },
    formatDelta(value: number): string {
      if (value > 0) return '+' + value;
      if (value < 0) return String(value);
      return '+0';
    },
    rogueBonusStyle(value: number): string {
      const color = value > 0 ? '#7d7' : value < 0 ? '#e88' : '#aaa';
      return 'padding: 8px 10px; background: rgba(255,255,255,0.05); border-radius: 4px; color: ' + color + ';';
    },
    isBanned(cardName: string): boolean {
      const app = this as unknown as MainAppData;
      const profile = app.roguelikeSelectedProfile;
      if (!profile) return false;
      const wildcard = profile.upgradeTree?.bannedCards || [];
      if (wildcard.includes(cardName)) return true;
      // A card with its "Ban Card" upgrade purchased is permanently banned.
      const progress = (profile.cardProgress || []).find((cp: any) => cp.cardName === cardName);
      return progress?.progress?.canBan === true;
    },
    async setBanState(cardName: string, action: 'ban' | 'unban') {
      const app = this as unknown as MainAppData;
      if (!app.roguelikeSelectedProfile) return;
      try {
        const res = await fetch('/api/roguelike/ban', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({profileId: app.roguelikeSelectedProfile.id, cardName, action}),
        });
        if (res.ok) {
          app.roguelikeSelectedProfile = await res.json();
        } else {
          const err = await res.text();
          alert('Failed to ' + action + ' card: ' + err);
        }
      } catch (e) {
        console.error('Failed to toggle ban:', e);
      }
    },
    async banCardFromInput() {
      const app = this as unknown as MainAppData;
      const cardName = (app.banDropdownSelection || '').trim();
      if (!cardName) return;
      if (!ROGUELIKE_BANNABLE_CARDS.includes(cardName)) {
        alert(`"${cardName}" is not a bannable card. Pick a card from the list.`);
        return;
      }
      app.banDropdownSelection = '';
      await this.setBanState(cardName, 'ban');
    },
    async unbanCard(cardName: string) {
      await this.setBanState(cardName, 'unban');
    },
  },
  mounted() {
    setDocumentTitle();
    if (!windowHasHTMLDialogElement()) {
      dialogPolyfill.registerDialog(document.getElementById('alert-dialog') as HTMLDialogElement);
    }
    const currentPathname = getLastPathSegment();
    console.log('App mounted, currentPathname:', currentPathname, 'paths.ROGUELIKE:', paths.ROGUELIKE);
    const app = this as unknown as MainAppData & {updatePlayer(): void; updateSpectator(): void};
    if (currentPathname === paths.PLAYER) {
      app.updatePlayer();
    } else if (currentPathname === paths.THE_END) {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id') || '';
      if (isPlayerId(id)) {
        app.updatePlayer();
      } else if (isSpectatorId(id)) {
        app.updateSpectator();
      } else {
        alert('Bad id URL parameter.');
      }
    } else if (currentPathname === paths.GAME) {
      const url = paths.API_GAME + window.location.search;
      fetch(url)
        .then((resp) => {
          if (!resp.ok) {
            throw new Error(`Error getting game data: ${resp.statusText}`);
          }
          return resp.json();
        })
        .then((appGame: SimpleGameModel) => {
          app.screen = 'game-home';
          app.game = appGame;
          window.history.replaceState(
            appGame,
            `${constants.APP_NAME} - Game`,
            `${paths.GAME}?id=${appGame.id}`,
          );
        })
        .catch((err) => {
          alert('Error getting game data');
          console.error(err);
        });
    } else if (currentPathname === paths.GAMES_OVERVIEW) {
      app.screen = 'games-overview';
    } else if (currentPathname === paths.NEW_GAME) {
      app.screen = 'create-game-form';
    } else if (currentPathname === paths.LOAD) {
      app.screen = 'load';
    } else if (currentPathname === paths.CARDS) {
      app.screen = 'cards';
    } else if (currentPathname === paths.HELP) {
      app.screen = 'help';
    } else if (currentPathname === paths.ROGUELIKE) {
      console.log('Setting screen to roguelike');
      app.screen = 'roguelike';
      (this as unknown as {loadRoguelikeProfiles(): void}).loadRoguelikeProfiles();
    } else if (currentPathname === paths.SPECTATOR) {
      app.updateSpectator();
    } else if (currentPathname === paths.ADMIN) {
      app.screen = 'admin';
    } else if (currentPathname === paths.LOGIN) {
      app.screen = 'login-home';
    } else {
      // Default to roguelike mode - this is now the main experience
      app.screen = 'roguelike';
      (this as unknown as {loadRoguelikeProfiles(): void}).loadRoguelikeProfiles();
    }
  },
});
</script>
