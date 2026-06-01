using MatricasAlbum.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace MatricasAlbum.Api.Data;

public sealed class AlbumDbContext(DbContextOptions<AlbumDbContext> options) : DbContext(options)
{
    public DbSet<ActivityType> ActivityTypes => Set<ActivityType>();
    public DbSet<StickerResource> StickerResources => Set<StickerResource>();
    public DbSet<StickerVersion> StickerVersions => Set<StickerVersion>();
    public DbSet<AlbumTemplate> AlbumTemplates => Set<AlbumTemplate>();
    public DbSet<AlbumTemplateVersion> AlbumTemplateVersions => Set<AlbumTemplateVersion>();
    public DbSet<AlbumTemplateVersionDifferentiationPath> AlbumTemplateVersionDifferentiationPaths => Set<AlbumTemplateVersionDifferentiationPath>();
    public DbSet<AlbumTemplateVersionSticker> AlbumTemplateVersionStickers => Set<AlbumTemplateVersionSticker>();
    public DbSet<AlbumTemplateSticker> AlbumTemplateStickers => Set<AlbumTemplateSticker>();
    public DbSet<AlbumInstance> AlbumInstances => Set<AlbumInstance>();
    public DbSet<AlbumInstanceWeekPlan> AlbumInstanceWeekPlans => Set<AlbumInstanceWeekPlan>();
    public DbSet<AlbumInstanceClosureChecklistItem> AlbumInstanceClosureChecklistItems => Set<AlbumInstanceClosureChecklistItem>();
    public DbSet<AlbumInstanceTeacherEffectLog> AlbumInstanceTeacherEffectLogs => Set<AlbumInstanceTeacherEffectLog>();
    public DbSet<InstanceSticker> InstanceStickers => Set<InstanceSticker>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
    public DbSet<Evidence> Evidence => Set<Evidence>();
    public DbSet<InstanceStickerTeamProgress> InstanceStickerTeamProgress => Set<InstanceStickerTeamProgress>();
    public DbSet<InstanceStickerTeamDifferentiationPath> InstanceStickerTeamDifferentiationPaths => Set<InstanceStickerTeamDifferentiationPath>();
    public DbSet<AlbumInstanceTeamReflection> AlbumInstanceTeamReflections => Set<AlbumInstanceTeamReflection>();
    public DbSet<TeamHelpRequest> TeamHelpRequests => Set<TeamHelpRequest>();
    public DbSet<QualityDimension> QualityDimensions => Set<QualityDimension>();
    public DbSet<QualityDimensionChange> QualityDimensionChanges => Set<QualityDimensionChange>();
    public DbSet<AiNote> AiNotes => Set<AiNote>();
    public DbSet<AiAdvice> AiAdvices => Set<AiAdvice>();
    public DbSet<AiAdviceRun> AiAdviceRuns => Set<AiAdviceRun>();
    public DbSet<SeedMarker> SeedMarkers => Set<SeedMarker>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ActivityType>(entity =>
        {
            entity.ToTable("activity_types");
            entity.HasKey(x => x.Key);
            entity.Property(x => x.Key).HasMaxLength(40);
            entity.Property(x => x.Name).HasMaxLength(80);
            entity.Property(x => x.PedagogyModel).HasMaxLength(60);
        });

        modelBuilder.Entity<StickerResource>(entity =>
        {
            entity.ToTable("sticker_resources");
            entity.Property(x => x.Title).HasMaxLength(180);
            entity.HasMany(x => x.Versions).WithOne(x => x.StickerResource).HasForeignKey(x => x.StickerResourceId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StickerVersion>(entity =>
        {
            entity.ToTable("sticker_versions");
            entity.Property(x => x.Title).HasMaxLength(180);
            entity.Property(x => x.Phase).HasMaxLength(40);
            entity.Property(x => x.EvidenceTypeLabel).HasMaxLength(120);
            entity.HasIndex(x => new { x.StickerResourceId, x.VersionNumber }).IsUnique();
            entity.HasMany(x => x.TeacherSteps).WithOne(x => x.StickerVersion).HasForeignKey(x => x.StickerVersionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StickerVersionTeacherStep>(entity =>
        {
            entity.ToTable("sticker_version_teacher_steps");
            entity.HasIndex(x => new { x.StickerVersionId, x.SortOrder }).IsUnique();
        });

        modelBuilder.Entity<AlbumTemplate>(entity =>
        {
            entity.ToTable("album_templates");
            entity.Property(x => x.Title).HasMaxLength(160);
            entity.Property(x => x.Subject).HasMaxLength(120);
            entity.Property(x => x.Grade).HasMaxLength(80);
            entity.Property(x => x.DurationType).HasMaxLength(20).HasDefaultValue("het");
            entity.Property(x => x.PatternKey).HasMaxLength(60).HasDefaultValue(AlbumTemplatePatterns.General);
            entity.Property(x => x.PatternName).HasMaxLength(120).HasDefaultValue(AlbumTemplatePatterns.Name(AlbumTemplatePatterns.General));
            entity.Property(x => x.PatternDescription).HasMaxLength(500).HasDefaultValue(AlbumTemplatePatterns.Description(AlbumTemplatePatterns.General));
            entity.Property(x => x.Audience).HasMaxLength(240);
            entity.HasMany(x => x.Versions).WithOne(x => x.AlbumTemplate).HasForeignKey(x => x.AlbumTemplateId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.Dispositions).WithOne(x => x.AlbumTemplate).HasForeignKey(x => x.AlbumTemplateId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.Weeks).WithOne(x => x.AlbumTemplate).HasForeignKey(x => x.AlbumTemplateId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.Stickers).WithOne(x => x.AlbumTemplate).HasForeignKey(x => x.AlbumTemplateId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.Instances).WithOne(x => x.AlbumTemplate).HasForeignKey(x => x.AlbumTemplateId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AlbumTemplateVersion>(entity =>
        {
            entity.ToTable("album_template_versions");
            entity.Property(x => x.Title).HasMaxLength(160);
            entity.Property(x => x.Subject).HasMaxLength(120);
            entity.Property(x => x.Grade).HasMaxLength(80);
            entity.Property(x => x.DurationType).HasMaxLength(20).HasDefaultValue("het");
            entity.Property(x => x.PatternKey).HasMaxLength(60).HasDefaultValue(AlbumTemplatePatterns.General);
            entity.Property(x => x.PatternName).HasMaxLength(120).HasDefaultValue(AlbumTemplatePatterns.Name(AlbumTemplatePatterns.General));
            entity.Property(x => x.PatternDescription).HasMaxLength(500).HasDefaultValue(AlbumTemplatePatterns.Description(AlbumTemplatePatterns.General));
            entity.Property(x => x.Audience).HasMaxLength(240);
            entity.Property(x => x.ProjectReflectionPromptsJson).HasColumnType("text");
            entity.HasIndex(x => new { x.AlbumTemplateId, x.VersionNumber }).IsUnique();
            entity.HasMany(x => x.Dispositions).WithOne(x => x.AlbumTemplateVersion).HasForeignKey(x => x.AlbumTemplateVersionId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.Weeks).WithOne(x => x.AlbumTemplateVersion).HasForeignKey(x => x.AlbumTemplateVersionId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.DifferentiationPaths).WithOne(x => x.AlbumTemplateVersion).HasForeignKey(x => x.AlbumTemplateVersionId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.Stickers).WithOne(x => x.AlbumTemplateVersion).HasForeignKey(x => x.AlbumTemplateVersionId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.Instances).WithOne(x => x.AlbumTemplateVersion).HasForeignKey(x => x.AlbumTemplateVersionId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AlbumTemplateVersionDisposition>(entity =>
        {
            entity.ToTable("album_template_version_dispositions");
            entity.Property(x => x.Name).HasMaxLength(80);
            entity.HasIndex(x => new { x.AlbumTemplateVersionId, x.SortOrder }).IsUnique();
        });

        modelBuilder.Entity<AlbumTemplateVersionWeekPlan>(entity =>
        {
            entity.ToTable("album_template_version_week_plans");
            entity.Property(x => x.Title).HasMaxLength(160);
            entity.HasIndex(x => new { x.AlbumTemplateVersionId, x.WeekNumber }).IsUnique();
        });

        modelBuilder.Entity<AlbumTemplateVersionDifferentiationPath>(entity =>
        {
            entity.ToTable("album_template_version_differentiation_paths");
            entity.Property(x => x.Phase).HasMaxLength(40);
            entity.Property(x => x.PathKey).HasMaxLength(40);
            entity.Property(x => x.Title).HasMaxLength(120);
            entity.Property(x => x.Description).HasMaxLength(800);
            entity.Property(x => x.RecommendedFor).HasMaxLength(500);
            entity.HasIndex(x => new { x.AlbumTemplateVersionId, x.Phase, x.PathKey }).IsUnique();
            entity.HasIndex(x => new { x.AlbumTemplateVersionId, x.SortOrder });
        });

        modelBuilder.Entity<AlbumTemplateVersionSticker>(entity =>
        {
            entity.ToTable("album_template_version_stickers");
            entity.HasIndex(x => new { x.AlbumTemplateVersionId, x.Week, x.SortOrder }).IsUnique();
            entity.HasOne(x => x.StickerVersion).WithMany().HasForeignKey(x => x.StickerVersionId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TemplateDisposition>(entity =>
        {
            entity.ToTable("template_dispositions");
            entity.Property(x => x.Name).HasMaxLength(80);
            entity.HasIndex(x => new { x.AlbumTemplateId, x.SortOrder }).IsUnique();
        });

        modelBuilder.Entity<TemplateWeekPlan>(entity =>
        {
            entity.ToTable("template_week_plans");
            entity.Property(x => x.Title).HasMaxLength(160);
            entity.HasIndex(x => new { x.AlbumTemplateId, x.WeekNumber }).IsUnique();
        });

        modelBuilder.Entity<AlbumTemplateSticker>(entity =>
        {
            entity.ToTable("album_template_stickers");
            entity.HasIndex(x => new { x.AlbumTemplateId, x.Week, x.SortOrder }).IsUnique();
            entity.HasOne(x => x.StickerVersion).WithMany().HasForeignKey(x => x.StickerVersionId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AlbumInstance>(entity =>
        {
            entity.ToTable("album_instances");
            entity.Property(x => x.Title).HasMaxLength(180);
            entity.Property(x => x.ClassName).HasMaxLength(120);
            entity.HasOne(x => x.AlbumTemplateVersion).WithMany(x => x.Instances).HasForeignKey(x => x.AlbumTemplateVersionId).OnDelete(DeleteBehavior.Restrict);
            entity.HasMany(x => x.Stickers).WithOne(x => x.AlbumInstance).HasForeignKey(x => x.AlbumInstanceId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.Teams).WithOne(x => x.AlbumInstance).HasForeignKey(x => x.AlbumInstanceId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.WeekPlanOverrides).WithOne(x => x.AlbumInstance).HasForeignKey(x => x.AlbumInstanceId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.ClosureChecklist).WithOne(x => x.AlbumInstance).HasForeignKey(x => x.AlbumInstanceId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.TeacherEffectLog).WithOne(x => x.AlbumInstance).HasForeignKey<AlbumInstanceTeacherEffectLog>(x => x.AlbumInstanceId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AlbumInstanceWeekPlan>(entity =>
        {
            entity.ToTable("album_instance_week_plans");
            entity.Property(x => x.Title).HasMaxLength(240);
            entity.HasIndex(x => new { x.AlbumInstanceId, x.WeekNumber }).IsUnique();
        });

        modelBuilder.Entity<AlbumInstanceClosureChecklistItem>(entity =>
        {
            entity.ToTable("album_instance_closure_checklist_items");
            entity.Property(x => x.Label).HasMaxLength(240);
        });

        modelBuilder.Entity<AlbumInstanceTeacherEffectLog>(entity =>
        {
            entity.ToTable("album_instance_teacher_effect_logs");
            entity.Property(x => x.WorkedWell).HasColumnType("text");
            entity.Property(x => x.EngagementSignals).HasColumnType("text");
            entity.Property(x => x.AdaptationNotes).HasColumnType("text");
            entity.Property(x => x.ReuseNextTime).HasColumnType("text");
            entity.HasIndex(x => x.AlbumInstanceId).IsUnique();
        });

        modelBuilder.Entity<InstanceSticker>(entity =>
        {
            entity.ToTable("instance_stickers");
            entity.Property(x => x.State).HasMaxLength(40);
            entity.HasIndex(x => new { x.AlbumInstanceId, x.Week, x.SortOrder }).IsUnique();
            entity.HasOne(x => x.StickerVersion).WithMany().HasForeignKey(x => x.StickerVersionId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.AlbumTemplateSticker).WithMany().HasForeignKey(x => x.AlbumTemplateStickerId).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(x => x.AlbumTemplateVersionSticker).WithMany().HasForeignKey(x => x.AlbumTemplateVersionStickerId).OnDelete(DeleteBehavior.SetNull);
            entity.HasMany(x => x.Evidence).WithOne(x => x.InstanceSticker).HasForeignKey(x => x.InstanceStickerId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.TeamProgress).WithOne(x => x.InstanceSticker).HasForeignKey(x => x.InstanceStickerId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.TeamDifferentiationPaths).WithOne(x => x.InstanceSticker).HasForeignKey(x => x.InstanceStickerId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<InstanceStickerTeamProgress>(entity =>
        {
            entity.ToTable("instance_sticker_team_progress");
            entity.Property(x => x.State).HasMaxLength(40);
            entity.HasIndex(x => new { x.InstanceStickerId, x.TeamId }).IsUnique();
            entity.HasOne(x => x.Team).WithMany().HasForeignKey(x => x.TeamId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<InstanceStickerTeamDifferentiationPath>(entity =>
        {
            entity.ToTable("instance_sticker_team_differentiation_paths");
            entity.Property(x => x.PathKey).HasMaxLength(40);
            entity.HasIndex(x => new { x.InstanceStickerId, x.TeamId }).IsUnique();
            entity.HasIndex(x => new { x.TeamId, x.AssignedAt });
            entity.HasOne(x => x.Team).WithMany().HasForeignKey(x => x.TeamId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AlbumInstanceTeamReflection>(entity =>
        {
            entity.ToTable("album_instance_team_reflections");
            entity.HasIndex(x => new { x.AlbumInstanceId, x.TeamId }).IsUnique();
            entity.HasOne(x => x.AlbumInstance).WithMany().HasForeignKey(x => x.AlbumInstanceId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Team).WithMany().HasForeignKey(x => x.TeamId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TeamHelpRequest>(entity =>
        {
            entity.ToTable("team_help_requests");
            entity.Property(x => x.Question).IsRequired();
            entity.HasIndex(x => new { x.AlbumInstanceId, x.ResolvedAt });
            entity.HasIndex(x => new { x.TeamId, x.ResolvedAt });
            entity.HasOne(x => x.AlbumInstance).WithMany().HasForeignKey(x => x.AlbumInstanceId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Team).WithMany().HasForeignKey(x => x.TeamId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.InstanceSticker).WithMany().HasForeignKey(x => x.InstanceStickerId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Team>(entity =>
        {
            entity.ToTable("teams");
            entity.Property(x => x.Name).HasMaxLength(120);
            entity.Property(x => x.Focus).HasMaxLength(180);
            entity.Property(x => x.Color).HasMaxLength(20);
            entity.HasMany(x => x.Members).WithOne(x => x.Team).HasForeignKey(x => x.TeamId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.Evidence).WithOne(x => x.Team).HasForeignKey(x => x.TeamId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TeamMember>(entity =>
        {
            entity.ToTable("team_members");
            entity.Property(x => x.Name).HasMaxLength(80);
            entity.HasIndex(x => new { x.TeamId, x.SortOrder }).IsUnique();
        });

        modelBuilder.Entity<Evidence>(entity =>
        {
            entity.ToTable("evidence");
            entity.Property(x => x.Type).HasMaxLength(40);
            entity.Property(x => x.Status).HasMaxLength(40);
            entity.Property(x => x.Title).HasMaxLength(200);
            entity.Property(x => x.SubmittedBy).HasMaxLength(120);
            entity.HasIndex(x => new { x.InstanceStickerId, x.Status });
        });

        modelBuilder.Entity<QualityDimension>(entity =>
        {
            entity.ToTable("quality_dimensions");
            entity.Property(x => x.OwnerType).HasMaxLength(40);
            entity.Property(x => x.Code).HasMaxLength(40);
            entity.Property(x => x.Label).HasMaxLength(120);
            entity.Property(x => x.State).HasMaxLength(40);
            entity.Property(x => x.Reason).HasMaxLength(500);
            entity.HasIndex(x => new { x.OwnerType, x.OwnerId, x.Code }).IsUnique();
        });

        modelBuilder.Entity<QualityDimensionChange>(entity =>
        {
            entity.ToTable("quality_dimension_changes");
            entity.Property(x => x.TriggerType).HasMaxLength(80);
            entity.Property(x => x.PreviousState).HasMaxLength(40);
            entity.Property(x => x.NewState).HasMaxLength(40);
            entity.Property(x => x.Reason).HasMaxLength(500);
            entity.HasIndex(x => new { x.QualityDimensionId, x.CreatedAt });
            entity.HasOne(x => x.QualityDimension).WithMany().HasForeignKey(x => x.QualityDimensionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AiNote>(entity =>
        {
            entity.ToTable("ai_notes");
            entity.Property(x => x.OwnerType).HasMaxLength(40);
            entity.Property(x => x.TargetType).HasMaxLength(40);
            entity.Property(x => x.TargetKey).HasMaxLength(80);
            entity.Property(x => x.Kind).HasMaxLength(40);
            entity.Property(x => x.Label).HasMaxLength(180);
            entity.Property(x => x.Severity).HasMaxLength(40);
            entity.HasIndex(x => new { x.OwnerType, x.OwnerId });
            entity.HasIndex(x => new { x.OwnerType, x.OwnerId, x.TargetType, x.TargetId });
            entity.HasIndex(x => new { x.OwnerType, x.OwnerId, x.TargetType, x.TargetKey });
        });

        modelBuilder.Entity<AiAdviceRun>(entity =>
        {
            entity.ToTable("ai_advice_runs");
            entity.Property(x => x.Audience).HasMaxLength(40);
            entity.Property(x => x.OwnerType).HasMaxLength(40);
            entity.Property(x => x.TargetType).HasMaxLength(40);
            entity.Property(x => x.TargetKey).HasMaxLength(80);
            entity.Property(x => x.SnapshotHash).HasMaxLength(80);
            entity.Property(x => x.Status).HasMaxLength(40);
            entity.Property(x => x.Model).HasMaxLength(80);
            entity.Property(x => x.PromptVersion).HasMaxLength(80);
            entity.Property(x => x.ProjectionVersion).HasMaxLength(120);
            entity.HasIndex(x => new { x.OwnerType, x.OwnerId, x.Audience, x.StartedAt });
            entity.HasMany(x => x.Advices).WithOne(x => x.Run).HasForeignKey(x => x.RunId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<AiAdvice>(entity =>
        {
            entity.ToTable("ai_advices");
            entity.Property(x => x.Audience).HasMaxLength(40);
            entity.Property(x => x.OwnerType).HasMaxLength(40);
            entity.Property(x => x.TargetType).HasMaxLength(40);
            entity.Property(x => x.TargetKey).HasMaxLength(80);
            entity.Property(x => x.Kind).HasMaxLength(40);
            entity.Property(x => x.Severity).HasMaxLength(40);
            entity.Property(x => x.Status).HasMaxLength(40);
            entity.Property(x => x.ActionType).HasMaxLength(80);
            entity.Property(x => x.ActionLabel).HasMaxLength(180);
            entity.Property(x => x.Model).HasMaxLength(80);
            entity.Property(x => x.PromptVersion).HasMaxLength(80);
            entity.Property(x => x.ProjectionVersion).HasMaxLength(120);
            entity.Property(x => x.QuestionsJson).HasColumnType("jsonb");
            entity.Property(x => x.CitationsJson).HasColumnType("jsonb");
            entity.Property(x => x.ActionPayloadJson).HasColumnType("jsonb");
            entity.HasIndex(x => new { x.OwnerType, x.OwnerId, x.Audience, x.Status });
            entity.HasIndex(x => new { x.OwnerType, x.OwnerId, x.TargetType, x.TargetId });
            entity.HasIndex(x => new { x.OwnerType, x.OwnerId, x.TargetType, x.TargetKey });
        });

        modelBuilder.Entity<SeedMarker>(entity =>
        {
            entity.ToTable("seed_markers");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasMaxLength(120);
        });

        ConfigureClientGeneratedGuidKeys(modelBuilder);
    }

    private static void ConfigureClientGeneratedGuidKeys(ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            var idProperty = entityType.FindProperty("Id");
            if (idProperty?.ClrType == typeof(Guid))
            {
                idProperty.ValueGenerated = ValueGenerated.Never;
            }
        }
    }
}
