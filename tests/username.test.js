import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeUsername,usernameEmail,displayUsername} from '../username.js';
test('username normalization and deterministic identity',()=>{assert.equal(normalizeUsername(' Yisus_21 '),'yisus_21');assert.equal(usernameEmail('JULISSA'),'julissa@users.animejj.invalid');assert.equal(displayUsername({email:usernameEmail('Yisus')}),'yisus');});
test('reject malformed and ambiguous identities',()=>{for(const name of ['ab','a'.repeat(25),'julissa@foo.com','yisus x','jesús','<script>'])assert.throws(()=>normalizeUsername(name));});
