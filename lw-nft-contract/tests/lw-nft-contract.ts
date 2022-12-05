import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { LwNftContract } from "../target/types/lw_nft_contract";
import {
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    createInitializeMintInstruction,
    MINT_SIZE
} from "@solana/spl-token"
import {SystemProgram, PublicKey} from "@solana/web3.js";
import {Keypair} from "solana";


describe("lw-nft-contract", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
    const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );

  const program = anchor.workspace.LwNftContract as Program<LwNftContract>;
  console.log(program.programId.toBase58());

  it("Is initialized!", async () => {

    // const lamports =
    //     await program.provider.connection.getMinimumBalanceForRentExemption(
    //         MINT_SIZE
    //     );
    //
    // const getMetadata = async (
    //     mint
    // ) => {
    //   return (
    //       await anchor.web3.PublicKey.findProgramAddress(
    //           [
    //             Buffer.from("metadata"),
    //             TOKEN_METADATA_PROGRAM_ID.toBuffer(),
    //             mint.toBuffer(),
    //           ],
    //           TOKEN_METADATA_PROGRAM_ID
    //       )
    //   )[0];
    // };
    // const getMasterEdition = async (
    //     mint
    // ) => {
    //   return (
    //       await anchor.web3.PublicKey.findProgramAddress(
    //           [
    //             Buffer.from("metadata"),
    //             TOKEN_METADATA_PROGRAM_ID.toBuffer(),
    //             mint.toBuffer(),
    //             Buffer.from("edition"),
    //           ],
    //           TOKEN_METADATA_PROGRAM_ID
    //       )
    //   )[0];
    // };
    //
    const mintKey = anchor.web3.Keypair.generate();
    // console.log("NFT Account: ", NftTokenAccount.toBase58());
    //
    // const mint_tx = new anchor.web3.Transaction().add(
    //     anchor.web3.SystemProgram.createAccount({
    //       fromPubkey: provider.wallet.publicKey,
    //       newAccountPubkey: mintKey.publicKey,
    //       space: MINT_SIZE,
    //       programId: TOKEN_PROGRAM_ID,
    //       lamports,
    //     }),
    //     createInitializeMintInstruction(
    //         mintKey.publicKey,
    //         0,
    //         provider.wallet.publicKey,
    //         provider.wallet.publicKey
    //     ),
    //     createAssociatedTokenAccountInstruction(
    //         provider.wallet.publicKey,
    //         NftTokenAccount,
    //         provider.wallet.publicKey,
    //         mintKey.publicKey
    //     )
    // );
    // const res = await provider.sendAndConfirm(mint_tx, [mintKey]);
    // console.log(
    //     await provider.connection.getParsedAccountInfo(mintKey.publicKey)
    // );
    // console.log("Account: ", res);
    // console.log("Mint key: ", mintKey.publicKey.toString());
    // console.log("User: ", provider.wallet.publicKey.toString());
    // const metadataAddress = await getMetadata(mintKey.publicKey);
    // const masterEdition = await getMasterEdition(mintKey.publicKey);
    // console.log("Metadata address: ", metadataAddress.toBase58());
    // console.log("MasterEdition: ", masterEdition.toBase58());
    //
    //
    // const mintToken = await program.methods.mintNft(
    //     mintKey.publicKey,
    //     "https://gateway.pinata.cloud/ipfs/QmeX86diYB6VoMc5RCMM9c5Gy2oLb7TL73eYoq5ygGP4ib",
    //     "테스트토큰"
    // ).accounts({
    //     mintAuthority: provider.wallet.publicKey,
    //     mint: mintKey.publicKey,
    //     tokenAccount: NftTokenAccount,
    //     tokenProgram: TOKEN_PROGRAM_ID,
    //     metadata: metadataAddress,
    //     tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    //     payer: provider.wallet.publicKey,
    //     systemProgram: SystemProgram.programId,
    //     rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //     masterEdition: masterEdition,
    // })
    //     .rpc();

      const buyerTokenAddress = await anchor.utils.token.associatedAddress({
          mint: new PublicKey("3v1P9gkbNYkuRrGg3U3TpnocaQwuBbvXAjQrNVqkAXT1"),
          owner: new PublicKey("dxBrT5i6WYgvKk1j4iSfgtWRE1StkvbKVcVjapGCvGD"),
      });

    const tx = await program.methods.buyNft(
        new anchor.BN(1000),
        new anchor.BN(700),
    ).accounts({
        mint: new PublicKey("3v1P9gkbNYkuRrGg3U3TpnocaQwuBbvXAjQrNVqkAXT1"),
        ownerTokenAccount: new PublicKey("u8c3tTVfLePE7oKPi3q2JroocpnoiXHFgXzr9f21wpK"),
        ownerAuthority: provider.wallet.publicKey,
        ownerUpzTokenAccount: new PublicKey("GjZERjMQqWyXPcDpYaeaoFJkR1446cCtEQs3UcYj4PWS"),
        buyerTokenAccount: buyerTokenAddress,
        buyerAuthority: new PublicKey("dxBrT5i6WYgvKk1j4iSfgtWRE1StkvbKVcVjapGCvGD"),
        buyerUpzTokenAccount: new PublicKey("5kThbfwyW3qAcSGrGbTqKmEeNeXPiLN7MvHseoFG233G"),
        }
    )
        .signers([mintKey])
        .rpc();
  });
});
