# Rollback `@wh1teee/mui-otp-input` 8.0.0

Stable artifacts are immutable. Do not rebuild, overwrite, unpublish, or republish `8.0.0`.

1. Confirm the Git tag, candidate SHA-256, registry SHA-256, provenance audit, and GitHub Release evidence.
2. Stop downstream rollout and pin the last verified exact version.
3. Mark the affected version without mutating its bytes:

   ```sh
   npm deprecate @wh1teee/mui-otp-input@8.0.0 "Withdrawn; pin the previous verified version while 8.0.1 is prepared."
   ```

4. If a prior stable exists, restore `latest` to it. For the first stable v8 release, publish a corrected `8.0.1` and promote that exact artifact instead of pointing `latest` to a prerelease.
5. Keep `next` on the reviewed prerelease for forensic reproduction unless a separately verified prerelease replaces it.
6. Mark the matching GitHub Release as withdrawn and link the corrective release.

A correction requires a new SemVer version, source commit, tag, OIDC publication, and byte-parity verification.
