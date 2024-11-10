
const spells = {
    fireball: new function () {
        this.values = [50];
        this.id = 'fireball';
        this.name = 'Fireball';
        this.description = `Does ${this.values[0]} fire damage.`;
        this.cost = 20;
        this.time = 0;
        this.cooldown = 0;
        this.canCast = () => true;

        this.cast = (app, player, target) => {
            app.damage(target, player, this.values[0], 'fire');
        };
    },
    ignite: new function () {
        this.values = [60, 4];
        this.id = 'ignite';
        this.name = 'Ignite';
        this.description = `Does ${this.values[0]} fire damage over ${this.values[1]} seconds.`;
        this.cost = 15;
        this.time = 0;
        this.cooldown = 5;

        this.canCast = (app, player, target) => {
            return !target.isIgnited;
        };

        this.cast = (app, player, target) => {
            target.isIgnited = true;
            app.damage(target, player, this.values[0] / this.values[1], 'fire');

            app.addEvent(this.values[1] / 4 * app.fps, () => {
                app.damage(target, player, this.values[0] / this.values[1], 'fire');
            });

            app.addEvent(this.values[1] / 4 * app.fps * 2, () => {
                app.damage(target, player, this.values[0] / this.values[1], 'fire');
            });

            app.addEvent(this.values[1] / 4 * app.fps * 3, () => {
                app.damage(target, player, this.values[0] / this.values[1], 'fire');
                target.isIgnited = false;
            });
        };
    },
};

const app = Vue.createApp({
    el: '#app',
    data() {
        return {
            spells,
            events: {},
            currentTime: 0,
            fps: 2,
            globalCooldown: 0, // TODO: move to player object

            target: {
                health: 1000,
                mana: 1000,
            },

            player: {
                health: 1000,
                mana: 1000,
            },
        };
    },
    mounted() {
        window.setInterval(() => {
            this.currentTime++;

            if (this.globalCooldown > 0)
                this.globalCooldown--;

            console.log(this.currentTime, this.events);

            this.executeEvents();
        }, 1 / this.fps * 1000)
    },
    methods: {
        addEvent(delay, callback) {
            if (delay <= 0)
                callback();

            const executeAt = this.currentTime + delay;
            this.events[executeAt] ??= [];
            this.events[executeAt].push(callback);
        },
        executeEvents() {
            const events = this.events[this.currentTime] ?? [];

            for (const event of events) {
                event();
            }

            delete this.events[this.currentTime];
        },
        damage(target, player, amount, type) {
            // adjust damage amount
            amount = Math.min(target.health, amount);
            amount = Math.round(amount);

            // apply
            target.health -= amount;

            // bookkeeping
            player.damageDone += amount;
            target.damageTaken += amount;
        },
        castSpell(spellId) {
            const spell = this.spells[spellId];

            // TODO: allow pre-casting
            if (this.globalCooldown > 0)
                return;

            if (!spell.canCast(this, this.player, this.target))
                return;

            spell.cast(this, this.player, this.target);
            this.globalCooldown = this.fps;
            this.player.mana -= spell.cost;
            // TODO: spell cooldown
        },
    },
});

app.mount('#app');
