# Rollback `@wh1teee/mui-otp-input` 8.0.1

Stable artifacts are immutable. Do not rebuild, overwrite, unpublish, or
republish `8.0.1`.

1. Confirm the Git tag, candidate SHA-256, registry SHA-256, provenance audit,
   and GitHub Release evidence.
2. Stop downstream rollout and pin the last verified exact version.
3. Mark the affected version without mutating its bytes:

   ```sh
   npm deprecate @wh1teee/mui-otp-input@8.0.1 "Withdrawn; pin the previous verified version while a corrective patch is prepared."
   ```

4. Restore `latest` only to a separately verified stable artifact.
5. Keep `next` on the reviewed prerelease for forensic reproduction.
6. Publish any correction under a new SemVer version with a new source commit,
   tag, OIDC publication, provenance and registry byte-parity proof.
